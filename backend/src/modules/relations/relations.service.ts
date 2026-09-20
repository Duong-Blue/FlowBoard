import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRelationDto } from './dto/create-relation.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class RelationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(sourceIssueId: string, actorId: string, dto: CreateRelationDto) {
    if (sourceIssueId === dto.targetIssueId) {
      throw new BadRequestException('Cannot link issue to itself');
    }

    const [source, target] = await Promise.all([
      this.prisma.issue.findUnique({ where: { id: sourceIssueId }, select: { id: true, projectId: true } }),
      this.prisma.issue.findUnique({ where: { id: dto.targetIssueId }, select: { id: true, projectId: true } }),
    ]);

    if (!source || !target) {
      throw new NotFoundException('One or both issues not found');
    }

    const existing = await this.prisma.issueRelation.findFirst({
      where: { sourceIssueId, targetIssueId: dto.targetIssueId, type: dto.type },
    });

    if (existing) {
      throw new BadRequestException('Relation already exists');
    }

    const relation = await this.prisma.issueRelation.create({
      data: { sourceIssueId, targetIssueId: dto.targetIssueId, type: dto.type },
    });

    await this.activityService.createActivity(sourceIssueId, actorId, 'RELATION_CREATED', {
      targetIssueId: dto.targetIssueId,
      type: dto.type,
    });

    return relation;
  }

  async findAll(issueId: string) {
    return this.prisma.issueRelation.findMany({
      where: { OR: [{ sourceIssueId: issueId }, { targetIssueId: issueId }] },
    });
  }

  async remove(issueId: string, relationId: string, actorId: string) {
    const relation = await this.prisma.issueRelation.findUnique({ where: { id: relationId } });
    if (!relation || (relation.sourceIssueId !== issueId && relation.targetIssueId !== issueId)) {
      throw new NotFoundException('Relation not found');
    }

    await this.prisma.issueRelation.delete({ where: { id: relationId } });

    await this.activityService.createActivity(issueId, actorId, 'RELATION_DELETED', {
      targetIssueId: relation.targetIssueId,
      type: relation.type,
    });

    return { success: true };
  }
}
