import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { projectMember } = request;

    if (!projectMember) {
      throw new ForbiddenException('Not a project member');
    }

    if (requiredRoles.includes(projectMember.role)) {
      return true;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectMember.projectId },
    });

    if (project) {
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: project.organizationId,
            userId: projectMember.userId,
          },
        },
      });

      if (
        orgMember &&
        (orgMember.role === 'OWNER' || orgMember.role === 'ADMIN')
      ) {
        return true;
      }
    }

    throw new ForbiddenException('Insufficient role permissions');
  }
}
