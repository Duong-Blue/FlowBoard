import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    orgId: string,
    invitedById: string,
    dto: { email: string; role: string },
  ) {
    const existing = await this.prisma.invitation.findFirst({
      where: {
        organizationId: orgId,
        email: dto.email,
        acceptedAt: null,
        revokedAt: null,
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

    return { invitationToken: rawToken };
  }

  async findPending(orgId: string) {
    return this.prisma.invitation.findMany({
      where: { organizationId: orgId, acceptedAt: null, revokedAt: null },
    });
  }

  async revoke(orgId: string, invitationId: string, requesterId: string) {
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

    return this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: userId,
          role: invitation.role,
        },
      });
    });
  }
}
