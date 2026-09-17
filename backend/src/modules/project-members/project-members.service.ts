import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectMembersService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkOrgAdminPermission(orgId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async resolveProjectId(projectParam: string): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectParam }, { key: projectParam }] },
      select: { id: true },
    });
    return project?.id || projectParam;
  }

  async add(projectParam: string, dto: { userId: string; role: ProjectRole }, requesterId: string) {
    const projectId = await this.resolveProjectId(projectParam);
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    await this.checkOrgAdminPermission(project.organizationId, requesterId);

    const orgMember = await this.prisma.organizationMember.findFirst({
        where: { organizationId: project.organizationId, userId: dto.userId }
    });
    
    if (!orgMember) {
      throw new BadRequestException('User must be an organization member');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  async findAll(projectParam: string, requesterId: string) {
    const projectId = await this.resolveProjectId(projectParam);
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true },
    });
  }

  async updateRole(projectParam: string, targetUserId: string, requesterId: string, role: ProjectRole) {
    const projectId = await this.resolveProjectId(projectParam);
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    await this.checkOrgAdminPermission(project.organizationId, requesterId);

    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: { role },
    });
  }

  async remove(projectParam: string, targetUserId: string, requesterId: string) {
    const projectId = await this.resolveProjectId(projectParam);
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    await this.checkOrgAdminPermission(project.organizationId, requesterId);

    return this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
  }
}
