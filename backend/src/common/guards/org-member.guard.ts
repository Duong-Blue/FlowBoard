import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.orgId;
    if (!user || !user.orgMemberships?.includes(orgId)) {
      throw new ForbiddenException('Not an org member');
    }
    return true;
  }
}
