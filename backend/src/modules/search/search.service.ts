import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async getAccessibleProjectIds(
    userId: string,
    orgId?: string,
  ): Promise<string[]> {
    const members = await this.prisma.projectMember.findMany({
      where: {
        userId,
        ...(orgId ? { project: { organizationId: orgId } } : {}),
      },
      select: { projectId: true },
    });
    return members.map((m) => m.projectId);
  }
}
