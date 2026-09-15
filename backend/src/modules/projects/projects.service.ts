import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateProjectDto) {
    const existing = await this.prisma.project.findFirst({ where: { organizationId: orgId, key: dto.key } });
    if (existing) throw new ConflictException('Project key must be unique');

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: dto.name,
          key: dto.key,
          description: dto.description,
          organizationId: orgId,
          createdById: userId,
        },
      });
      await tx.projectMember.create({
        data: { projectId: project.id, userId, role: 'ADMIN' },
      });
      return project;
    });
  }

  async findAll(orgId: string, userId: string) {
    return this.prisma.project.findMany({
      where: { organizationId: orgId, members: { some: { userId } } },
    });
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, members: { some: { userId } } },
    });
    if (!project) throw new NotFoundException();
    return project;
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.findOne(projectId, userId);
    return this.prisma.project.update({ where: { id: projectId }, data: dto });
  }

  async delete(projectId: string, userId: string) {
    await this.findOne(projectId, userId);
    return this.prisma.project.delete({ where: { id: projectId } });
  }
}
