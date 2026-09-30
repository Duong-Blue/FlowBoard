import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService, private readonly notificationsService: NotificationsService) {}

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

  async create(
    orgIdOrSlug: string,
    invitedById: string,
    dto: { email: string; role: string },
  ) {
    const orgId = await this.resolveOrgId(orgIdOrSlug);
    const requester = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: invitedById },
      },
      include: { user: true },
    });
    if (
      !requester ||
      (requester.role !== 'OWNER' && requester.role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (dto.role === 'OWNER') {
      throw new ForbiddenException('Cannot invite as OWNER');
    }
    if (requester.user.email.toLowerCase() === dto.email.toLowerCase()) {
      throw new BadRequestException('Cannot invite yourself');
    }

    const activeMember = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        user: { email: { equals: dto.email, mode: 'insensitive' } },
      },
    });
    if (activeMember) {
      throw new ConflictException('User is already a member');
    }

    const existing = await this.prisma.invitation.findFirst({
      where: {
        organizationId: orgId,
        email: dto.email,
        acceptedAt: null,
        revokedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) throw new ConflictException('Pending invitation exists');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.prisma.invitation.create({
      data: {
        organization: { connect: { id: orgId } },
        invitedBy: { connect: { id: invitedById } },
        email: dto.email,
        role: dto.role as any,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

            const user = await this.prisma.user.findFirst({
          where: { email: { equals: dto.email, mode: 'insensitive' } },
        });

        if (user) {
          const org = await this.prisma.organization.findFirst({
            where: { id: orgId },
            select: { name: true },
          });

          await this.notificationsService.createNotification({
            userId: user.id,
            actorId: invitedById,
            organizationId: orgId,
            type: NotificationType.ORGANIZATION_INVITATION,
            title: 'Organization Invitation',
            message: `You have been invited to join ${org?.name || 'an organization'}`, 
            metadata: { token: rawToken },
          });
        }

        return { invitationToken: rawToken };
  }

  async findPending(orgIdOrSlug: string, requesterId: string) {
    const orgId = await this.resolveOrgId(orgIdOrSlug);
    const requester = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: requesterId },
    });
    if (
      !requester ||
      (requester.role !== 'OWNER' && requester.role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.invitation.findMany({
      where: {
        organizationId: orgId,
        acceptedAt: null,
        revokedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPendingForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    return this.prisma.invitation.findMany({
      where: {
        email: { equals: user.email, mode: 'insensitive' },
        acceptedAt: null,
        revokedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async revoke(orgIdOrSlug: string, invitationId: string, requesterId: string) {
    const orgId = await this.resolveOrgId(orgIdOrSlug);
    const requester = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: requesterId },
    });
    if (
      !requester ||
      (requester.role !== 'OWNER' && requester.role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation || invitation.organizationId !== orgId)
      throw new NotFoundException();

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { revokedAt: new Date() },
    });
  }

  async accept(rawToken: string, userId: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!invitation) throw new BadRequestException('Invalid or expired token');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'Invitation token was not issued for this user email',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });
        return await tx.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId: userId,
            role: invitation.role,
          },
        });
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const existingMember = await this.prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: invitation.organizationId,
              userId: userId,
            },
          },
        });
        if (existingMember) {
          await this.prisma.invitation.update({
            where: { id: invitation.id },
            data: { acceptedAt: new Date() },
          });
          return existingMember;
        }
      }
      throw error;
    }
  }

  async decline(rawToken: string, userId: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!invitation) throw new BadRequestException('Invalid or expired token');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'Invitation token was not issued for this user email',
      );
    }

    return this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { declinedAt: new Date() },
    });
  }
}
