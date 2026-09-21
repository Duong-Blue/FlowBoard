import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';
import { UpdateSavedViewDto } from './dto/update-saved-view.dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class SavedViewsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateFilterJson(filterJson: any) {
    if (typeof filterJson !== 'object' || filterJson === null) {
      throw new BadRequestException('filterJson must be an object');
    }

    const getDepth = (obj: any): number => {
      if (obj === null || typeof obj !== 'object') return 0;
      let maxDepth = 0;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          maxDepth = Math.max(maxDepth, getDepth(obj[key]));
        }
      }
      return maxDepth + 1;
    };

    if (getDepth(filterJson) > 5) {
      throw new BadRequestException('filterJson is too deeply nested (max depth 5)');
    }
  }

  async create(
    projectId: string,
    userId: string,
    role: ProjectRole,
    dto: CreateSavedViewDto,
  ) {
    this.validateFilterJson(dto.filterJson);

    if (dto.isShared && role !== ProjectRole.ADMIN) {
      throw new ForbiddenException('Only project admins can create shared views');
    }

    return this.prisma.savedView.create({
      data: {
        projectId,
        createdById: userId,
        name: dto.name,
        filterJson: dto.filterJson,
        isShared: dto.isShared || false,
      },
    });
  }

  async findAll(projectId: string, userId: string) {
    return this.prisma.savedView.findMany({
      where: {
        projectId,
        OR: [
          { isShared: true },
          { createdById: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, id: string, userId: string) {
    const view = await this.prisma.savedView.findUnique({
      where: { id },
    });

    if (!view || view.projectId !== projectId) {
      throw new NotFoundException('Saved view not found');
    }

    if (!view.isShared && view.createdById !== userId) {
      throw new ForbiddenException('You do not have access to this private view');
    }

    return view;
  }

  async update(
    projectId: string,
    id: string,
    userId: string,
    role: ProjectRole,
    dto: UpdateSavedViewDto,
  ) {
    if (dto.filterJson !== undefined) {
      this.validateFilterJson(dto.filterJson);
    }

    const view = await this.findOne(projectId, id, userId);

    if (view.isShared) {
      if (role !== ProjectRole.ADMIN) {
        throw new ForbiddenException('Only project admins can edit shared views');
      }
    } else {
      if (view.createdById !== userId) {
        throw new ForbiddenException('You can only edit your own private views');
      }
    }

    if (dto.isShared !== undefined && dto.isShared !== view.isShared) {
      if (role !== ProjectRole.ADMIN) {
        throw new ForbiddenException('Only project admins can change the shared status');
      }
    }

    return this.prisma.savedView.update({
      where: { id },
      data: {
        name: dto.name,
        filterJson: dto.filterJson,
        isShared: dto.isShared,
      },
    });
  }

  async remove(projectId: string, id: string, userId: string, role: ProjectRole) {
    const view = await this.findOne(projectId, id, userId);

    if (view.isShared) {
      if (role !== ProjectRole.ADMIN) {
        throw new ForbiddenException('Only project admins can delete shared views');
      }
    } else {
      if (view.createdById !== userId) {
        throw new ForbiddenException('You can only delete your own private views');
      }
    }

    return this.prisma.savedView.delete({
      where: { id },
    });
  }
}
