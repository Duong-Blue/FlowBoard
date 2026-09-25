import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { projectMember } = context.switchToHttp().getRequest();
    
    if (!projectMember) {
      throw new ForbiddenException('Not a project member');
    }
    
    if (!requiredRoles.includes(projectMember.role)) {
      throw new ForbiddenException('Insufficient role permissions');
    }
    
    return true;
  }
}
