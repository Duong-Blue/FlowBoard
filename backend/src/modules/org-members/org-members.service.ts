import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrgRole } from '@prisma/client';

@Injectable()
export class OrgMembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.organizationMember.findMany({ where: { organizationId: orgId } });
  }

  async updateRole(orgId: string, targetUserId: string, requesterId: string, role: OrgRole) {
    const requester = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: requesterId } },
    });
    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (role === 'OWNER') throw new ForbiddenException('Cannot assign OWNER role');
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: targetUserId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot modify OWNER');
    return this.prisma.organizationMember.update({
      where: { id: member.id },
      data: { role },
    });
  }

  async remove(orgId: string, targetUserId: string, requesterId: string) {
    const requester = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: requesterId } },
    });
    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: targetUserId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot remove OWNER');
    
    return this.prisma.$transaction(async (tx) => {
      await tx.projectMember.deleteMany({
        where: { userId: targetUserId, project: { organizationId: orgId } },
      });
      return tx.organizationMember.delete({ where: { id: member.id } });
    });
  }
}
