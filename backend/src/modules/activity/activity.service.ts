import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueryActivityDto } from './dto/query-activity.dto';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  displayName: true,
  email: true,
  avatarUrl: true,
};

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string, issueId: string, queryDto: QueryActivityDto) {
    const issue = await this.prisma.issue.findFirst({
      where: { id: issueId, projectId },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found or does not belong to this project');
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.issueActivity.findMany({
        where: { issueId },
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { actor: { select: USER_SELECT } },
      }),
      this.prisma.issueActivity.count({ where: { issueId } }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
