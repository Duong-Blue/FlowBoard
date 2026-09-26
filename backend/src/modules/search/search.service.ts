import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions-query.dto';
import { SearchQueryDto, SearchEntityType, SearchSortBy, SearchSortOrder } from './dto/search-query.dto';
import { Prisma } from '@prisma/client';

const ISSUE_SELECT = {
  id: true,
  title: true,
  key: true,
  projectId: true,
  type: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  dueDate: true,
  project: {
    select: { id: true, key: true, name: true, organizationId: true }
  },
  workflowStatus: {
    select: { id: true, name: true, category: true, color: true }
  },
  assignee: {
    select: { id: true, displayName: true, email: true, avatarUrl: true }
  }
};

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async getAccessibleProjectIds(userId: string, orgId?: string): Promise<string[]> {
    const members = await this.prisma.projectMember.findMany({
      where: {
        userId,
        ...(orgId ? { project: { organizationId: orgId } } : {}),
      },
      select: { projectId: true },
    });
    return members.map((m) => m.projectId);
  }

  async getSuggestions(userId: string, dto: SearchSuggestionsQueryDto) {
    let accessibleProjectIds = await this.getAccessibleProjectIds(userId, dto.orgId);
    
    if (dto.projectId) {
      accessibleProjectIds = accessibleProjectIds.filter(id => id === dto.projectId);
    }

    if (accessibleProjectIds.length === 0) {
      return { exactMatch: null, issues: [], projects: [], users: [] };
    }

    const q = dto.q.trim();
    const isFullKey = /^[a-zA-Z0-9]+-\d+$/.test(q);
    const isShorthand = /^#\d+$/.test(q);

    if (!isFullKey && !isShorthand && q.length < 2) {
      return { exactMatch: null, issues: [], projects: [], users: [] };
    }

    let parsedKey = null;
    if (isFullKey) {
      parsedKey = q.toUpperCase();
    } else if (isShorthand && dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
        select: { key: true }
      });
      if (project) {
        parsedKey = `${project.key}-${q.slice(1)}`;
      }
    }

    let exactMatch = null;
    if (parsedKey) {
      const issue = await this.prisma.issue.findFirst({
        where: {
          key: parsedKey,
          projectId: { in: accessibleProjectIds }
        },
        select: ISSUE_SELECT
      });
      
      if (issue) {
        exactMatch = this.mapIssue(issue);
      }
    }

    const issues = await this.prisma.issue.findMany({
      where: {
        projectId: { in: accessibleProjectIds },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: ISSUE_SELECT,
      take: dto.limit
    });

    const projects = await this.prisma.project.findMany({
      where: {
        id: { in: accessibleProjectIds },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { key: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, key: true, organizationId: true },
      take: dto.limit
    });

    const users = await this.prisma.user.findMany({
      where: {
        projectMemberships: {
          some: { projectId: { in: accessibleProjectIds } }
        },
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { id: true, displayName: true, email: true, avatarUrl: true },
      take: dto.limit
    });

    return {
      exactMatch,
      issues: issues.map(i => this.mapIssue(i)),
      projects,
      users
    };
  }

  async fullSearch(userId: string, dto: SearchQueryDto) {
    let accessibleProjectIds = await this.getAccessibleProjectIds(userId, dto.orgId);
    
    if (dto.projectId) {
      accessibleProjectIds = accessibleProjectIds.filter(id => id === dto.projectId);
    }

    if (accessibleProjectIds.length === 0) {
      return { items: [], meta: { limit: dto.limit || 20, nextCursor: null, hasNextPage: false } };
    }

    if (dto.type === SearchEntityType.PROJECT) {
      return this.searchProjects(accessibleProjectIds, dto);
    } else if (dto.type === SearchEntityType.USER) {
      return this.searchUsers(accessibleProjectIds, dto);
    } else {
      return this.searchIssues(accessibleProjectIds, dto);
    }
  }

  private encodeCursor(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private decodeCursor(cursor: string): any {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }

  private async searchIssues(projectIds: string[], dto: SearchQueryDto) {
    const q = dto.q?.trim();
    const limit = dto.limit || 20;
    
    const conditions: Prisma.Sql[] = [
      Prisma.sql`i."projectId" IN (${Prisma.join(projectIds)})`
    ];

    if (dto.workflowStatusId) conditions.push(Prisma.sql`i."workflowStatusId" = ${dto.workflowStatusId}::uuid`);
    if (dto.statusCategory) conditions.push(Prisma.sql`(ws."category"::text = ${dto.statusCategory} OR i."status"::text = ${dto.statusCategory})`);
    if (dto.priority) conditions.push(Prisma.sql`i."priority"::text = ${dto.priority}`);
    if (dto.issueType) conditions.push(Prisma.sql`i."type"::text = ${dto.issueType}`);
    if (dto.assigneeId) conditions.push(Prisma.sql`i."assigneeId" = ${dto.assigneeId}::uuid`);
    if (dto.reporterId) conditions.push(Prisma.sql`i."reporterId" = ${dto.reporterId}::uuid`);
    if (dto.dueDateFrom) conditions.push(Prisma.sql`i."due_date" >= ${new Date(dto.dueDateFrom)}`);
    if (dto.dueDateTo) conditions.push(Prisma.sql`i."due_date" <= ${new Date(dto.dueDateTo)}`);

    let scoreSelect = Prisma.sql`0`;
    if (q) {
      conditions.push(Prisma.sql`(
        i."key" ILIKE ${q} OR
        i."title" ILIKE ${'%' + q + '%'} OR
        i."description" ILIKE ${'%' + q + '%'} OR
        p."name" ILIKE ${'%' + q + '%'} OR
        p."key" ILIKE ${'%' + q + '%'}
      )`);

      scoreSelect = Prisma.sql`
        CASE
          WHEN i."key" ILIKE ${q} THEN 100
          WHEN i."title" = ${q} THEN 90
          WHEN i."title" ILIKE ${q + '%'} THEN 80
          WHEN i."title" ILIKE ${'%' + q + '%'} THEN 70
          WHEN i."description" ILIKE ${'%' + q + '%'} THEN 50
          WHEN p."name" ILIKE ${'%' + q + '%'} OR p."key" ILIKE ${'%' + q + '%'} THEN 40
          ELSE 0
        END
      `;
    }

    const isRelevance = dto.sortBy === SearchSortBy.RELEVANCE && !!q;
    let sortByField = Prisma.sql`i."updatedAt"`;
    let sortDir = dto.sortOrder === SearchSortOrder.ASC ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    
    if (isRelevance) {
      sortByField = Prisma.sql`score`;
      sortDir = Prisma.sql`DESC`;
    } else if (dto.sortBy === SearchSortBy.CREATED_AT) {
      sortByField = Prisma.sql`i."createdAt"`;
    } else if (dto.sortBy === SearchSortBy.PRIORITY) {
      sortByField = Prisma.sql`i."priority"`;
    } else if (dto.sortBy === SearchSortBy.DUE_DATE) {
      sortByField = Prisma.sql`i."due_date"`;
    }

    if (dto.cursor) {
      const parsed = this.decodeCursor(dto.cursor);
      const { v, u, id } = parsed;
      const uDate = new Date(u);

      const comp = sortDir.text === 'ASC' ? Prisma.sql`>` : Prisma.sql`<`;
      
      let vSql;
      if (isRelevance) vSql = Prisma.sql`${v}::int`;
      else if (dto.sortBy === SearchSortBy.PRIORITY) vSql = Prisma.sql`${v}::text`;
      else if (dto.sortBy === SearchSortBy.CREATED_AT || dto.sortBy === SearchSortBy.DUE_DATE) vSql = Prisma.sql`${new Date(v)}`;
      else vSql = Prisma.sql`${uDate}`;

      if (isRelevance || !dto.sortBy || dto.sortBy === SearchSortBy.UPDATED_AT || dto.sortBy === SearchSortBy.CREATED_AT || dto.sortBy === SearchSortBy.DUE_DATE) {
        conditions.push(Prisma.sql`
          (
            ${sortByField} ${comp} ${vSql} OR
            (${sortByField} = ${vSql} AND i."updatedAt" < ${uDate}) OR
            (${sortByField} = ${vSql} AND i."updatedAt" = ${uDate} AND i."id" > ${id}::uuid)
          )
        `);
      } else {
        conditions.push(Prisma.sql`
          (
            ${sortByField}::text ${comp} ${vSql} OR
            (${sortByField}::text = ${vSql} AND i."updatedAt" < ${uDate}) OR
            (${sortByField}::text = ${vSql} AND i."updatedAt" = ${uDate} AND i."id" > ${id}::uuid)
          )
        `);
      }
    }

    const whereClause = Prisma.sql`${Prisma.join(conditions, ' AND ')}`;

    const query = Prisma.sql`
      SELECT i."id", ${scoreSelect} as score, i."updatedAt",
             ${dto.sortBy && !isRelevance && dto.sortBy !== SearchSortBy.UPDATED_AT ? sortByField : Prisma.sql`0`} as sort_val
      FROM "Issue" i
      JOIN "Project" p ON p."id" = i."projectId"
      LEFT JOIN "WorkflowStatus" ws ON ws."id" = i."workflowStatusId"
      WHERE ${whereClause}
      ORDER BY ${sortByField} ${sortDir}, i."updatedAt" DESC, i."id" ASC
      LIMIT ${limit + 1}
    `;

    const results: any[] = await this.prisma.$queryRaw(query);
    
    const hasNextPage = results.length > limit;
    const items = hasNextPage ? results.slice(0, limit) : results;
    
    let nextCursor = null;
    if (hasNextPage && items.length > 0) {
      const last = items[items.length - 1];
      let v = last.sort_val;
      if (isRelevance) v = last.score;
      else if (dto.sortBy === SearchSortBy.UPDATED_AT || !dto.sortBy) v = last.updatedAt;
      
      nextCursor = this.encodeCursor({
        v,
        u: last.updatedAt,
        id: last.id
      });
    }

    if (items.length === 0) {
      return { items: [], meta: { limit, nextCursor: null, hasNextPage: false } };
    }

    const issueIds = items.map(r => r.id);
    const fullIssues = await this.prisma.issue.findMany({
      where: { id: { in: issueIds } },
      select: ISSUE_SELECT
    });

    const orderedIssues = items.map(r => fullIssues.find(i => i.id === r.id)).filter(Boolean);

    return {
      items: orderedIssues.map(i => this.mapIssue(i)),
      meta: { limit, nextCursor, hasNextPage }
    };
  }

  private async searchProjects(projectIds: string[], dto: SearchQueryDto) {
    const q = dto.q?.trim();
    const limit = dto.limit || 20;
    
    const where: any = { id: { in: projectIds } };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { key: { contains: q, mode: 'insensitive' } }
      ];
    }

    const items = await this.prisma.project.findMany({
      where,
      select: { id: true, name: true, key: true, organizationId: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(dto.cursor ? { skip: 1, cursor: { id: this.decodeCursor(dto.cursor).id } } : {})
    });

    const hasNextPage = items.length > limit;
    const paginatedItems = hasNextPage ? items.slice(0, limit) : items;
    
    let nextCursor = null;
    if (hasNextPage && paginatedItems.length > 0) {
      nextCursor = this.encodeCursor({ id: paginatedItems[paginatedItems.length - 1].id });
    }

    return { items: paginatedItems, meta: { limit, nextCursor, hasNextPage } };
  }

  private async searchUsers(projectIds: string[], dto: SearchQueryDto) {
    const q = dto.q?.trim();
    const limit = dto.limit || 20;
    
    const where: any = {
      projectMemberships: { some: { projectId: { in: projectIds } } }
    };
    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }

    const items = await this.prisma.user.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(dto.cursor ? { skip: 1, cursor: { id: this.decodeCursor(dto.cursor).id } } : {}),
      select: { id: true, displayName: true, email: true, avatarUrl: true, updatedAt: true }
    });

    const hasNextPage = items.length > limit;
    const paginatedItems = hasNextPage ? items.slice(0, limit) : items;
    
    let nextCursor = null;
    if (hasNextPage && paginatedItems.length > 0) {
      nextCursor = this.encodeCursor({ id: paginatedItems[paginatedItems.length - 1].id });
    }

    return { items: paginatedItems, meta: { limit, nextCursor, hasNextPage } };
  }

  private mapIssue(issue: any) {
    return {
      id: issue.id,
      title: issue.title,
      key: issue.key,
      projectId: issue.projectId,
      projectKey: issue.project?.key,
      projectName: issue.project?.name,
      orgId: issue.project?.organizationId,
      workflowStatus: issue.workflowStatus ? {
        id: issue.workflowStatus.id,
        name: issue.workflowStatus.name,
        category: issue.workflowStatus.category,
        color: issue.workflowStatus.color,
      } : null,
      assignee: issue.assignee ? {
        id: issue.assignee.id,
        displayName: issue.assignee.displayName,
        email: issue.assignee.email,
        avatarUrl: issue.assignee.avatarUrl,
      } : null,
      type: issue.type,
      priority: issue.priority,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      dueDate: issue.dueDate,
    };
  }
}