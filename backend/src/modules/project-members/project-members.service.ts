import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectMembersService {
  constructor(private readonly db: PrismaService) {}

  async add(projectId: string, dto: { userId: string; role: ProjectRole }, requesterId: string) {
    const project = await this.db.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const member = await this.db.organizationMember.findFirst({
        where: { organizationId: project.organizationId, userId: dto.userId }
    });
    
    if (!member) {
      throw new BadRequestException('User must be an organization member');
    }

    return this.db.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  async findAll(projectId: string, requesterId: string) {
    return this.db.projectMember.findMany({
      where: { projectId },
      include: { user: true },
    });
  }

  async updateRole(projectId: string, targetUserId: string, requesterId: string, role: ProjectRole) {
    return this.db.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: { role },
    });
  }

  async remove(projectId: string, targetUserId: string, requesterId: string) {
    return this.db.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
  }
}
