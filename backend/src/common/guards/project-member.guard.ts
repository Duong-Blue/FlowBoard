import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = request.params.projectId;
    if (!user || !user.projectMemberships?.includes(projectId)) {
      throw new ForbiddenException('Not a project member');
    }
    return true;
  }
}
