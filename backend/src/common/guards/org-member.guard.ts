import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orgParam = request.params.orgId;
    const userId = request.user?.id || request.user?.sub || request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const org = await this.prisma.organization.findFirst({
      where: { OR: [{ id: orgParam }, { slug: orgParam }] },
      select: { id: true },
    });

    if (!org) {
      throw new ForbiddenException('Not an org member');
    }

    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: org.id, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not an org member');
    }

    request.orgMember = member;
    return true;
  }
}
