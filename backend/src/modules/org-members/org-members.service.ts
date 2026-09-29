import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { OrgRole } from '@prisma/client';

@Injectable()
export class OrgMembersService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  private async resolveOrgId(orgIdOrSlug: string): Promise<string> {
    if (!this.prisma.organization?.findFirst) {
      return orgIdOrSlug;
    }
    const org = await this.prisma.organization.findFirst({
      where: { OR: [{ id: orgIdOrSlug }, { slug: orgIdOrSlug }] },
      select: { id: true },
    });
    return org?.id || orgIdOrSlug;
  }

  async findAll(orgIdOrSlug: string) {
    const orgId = await this.resolveOrgId(orgIdOrSlug);
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async updateRole(
    orgIdOrSlug: string,
    targetUserId: string,
    requesterId: string,
    role: OrgRole,
  ) {
    if (targetUserId === requesterId) {
      throw new ForbiddenException('Cannot modify your own role');
    }

    const orgId = await this.resolveOrgId(orgIdOrSlug);
    const requester = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: requesterId },
      },
    });
    if (
      !requester ||
      (requester.role !== 'OWNER' && requester.role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (role === 'OWNER')
      throw new ForbiddenException('Cannot assign OWNER role');
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: targetUserId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER')
      throw new ForbiddenException('Cannot modify OWNER');
    return this.prisma.organizationMember.update({
      where: { id: member.id },
      data: { role },
    });
  }

  async remove(orgIdOrSlug: string, targetUserId: string, requesterId: string) {
    const orgId = await this.resolveOrgId(orgIdOrSlug);
    const requester = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: requesterId },
      },
    });
    if (
      !requester ||
      (requester.role !== 'OWNER' && requester.role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: targetUserId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.role === 'OWNER') {
      const ownerCount = await this.prisma.organizationMember.count({
        where: { organizationId: orgId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the only owner of the organization',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.deleteMany({
        where: { userId: targetUserId, project: { organizationId: orgId } },
      });
      await tx.organizationMember.delete({ where: { id: member.id } });
    });

    await this.activityService.createActivity({
      type: 'ORG_MEMBER_REMOVED',
      actorId: requesterId,
      organizationId: orgId,
      entityType: 'ORGANIZATION',
      metadata: { memberId: targetUserId, role: member.role },
    });
  }
}
