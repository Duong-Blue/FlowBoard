import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './create-organization.dto';
import { UpdateOrganizationDto } from './update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const slugBase = (dto.slug || dto.name).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const slug = dto.slug ? dto.slug : `${slugBase}-${Date.now().toString(36)}`;
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
        },
      });
      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          role: 'OWNER',
        },
      });
      return org;
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { members: { some: { userId } } },
    });
  }

  async findOne(orgId: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: {
        OR: [{ id: orgId }, { slug: orgId }],
        members: { some: { userId } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
    const org = await this.findOne(orgId, userId);
    return this.prisma.organization.update({
      where: { id: org.id },
      data: dto,
    });
  }

  async delete(orgId: string, userId: string) {
    const targetOrg = await this.findOne(orgId, userId);
    const org = await this.prisma.organization.findUnique({
      where: { id: targetOrg.id },
      include: { projects: true },
    });
    if (org?.projects.length) throw new Error('Cannot delete org with projects');
    return this.prisma.organization.delete({ where: { id: targetOrg.id } });
  }
}
