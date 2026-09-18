import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectParam = request.params.projectId || request.params.id;
    const userId = request.user?.id || request.user?.sub || request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!projectParam) {
      return true;
    }

    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectParam }, { key: { equals: projectParam, mode: 'insensitive' } }] },
      select: { id: true },
    });

    if (!project) {
      throw new ForbiddenException('Not a project member');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a project member');
    }

    request.projectMember = member;
    return true;
  }
}
