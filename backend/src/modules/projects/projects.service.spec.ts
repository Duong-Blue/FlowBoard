import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { vi } from 'vitest';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findFirst: vi.fn(),
              update: vi.fn(),
              delete: vi.fn(),
            },
            organization: { findFirst: vi.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should throw ForbiddenException if user is not ADMIN when updating', async () => {
    const project = {
      id: 'proj1',
      members: [{ userId: 'user1', role: 'MEMBER' }],
    };
    vi.spyOn(service, 'findOne').mockResolvedValue(project as any);

    await expect(
      service.update('proj1', 'user1', { name: 'New Name' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not ADMIN when deleting', async () => {
    const project = {
      id: 'proj1',
      members: [{ userId: 'user1', role: 'VIEWER' }],
    };
    vi.spyOn(service, 'findOne').mockResolvedValue(project as any);

    await expect(service.delete('proj1', 'user1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
