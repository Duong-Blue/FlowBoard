import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(orgParam: string, userId: string, dto: CreateProjectDto) {
    const org = await this.prisma.organization.findFirst({
      where: { OR: [{ id: orgParam }, { slug: orgParam }] },
    });
    if (!org) throw new NotFoundException('Organization not found');
    const orgId = org.id;

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

  async findAll(orgParam: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { OR: [{ id: orgParam }, { slug: orgParam }] },
    });
    if (!org) return [];
    return this.prisma.project.findMany({
      where: { organizationId: org.id, members: { some: { userId } } },
    });
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ id: projectId }, { key: { equals: projectId, mode: 'insensitive' } }],
        members: { some: { userId } },
      },
    });
    if (!project) throw new NotFoundException();
    return project;
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    const targetProject = await this.findOne(projectId, userId);
    return this.prisma.project.update({ where: { id: targetProject.id }, data: dto });
  }

  async delete(projectId: string, userId: string) {
    const targetProject = await this.findOne(projectId, userId);
    return this.prisma.project.delete({ where: { id: targetProject.id } });
  }
}
