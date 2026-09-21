import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsService } from './attachments.service';
import { PrismaService } from '../../database/prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { ActivityService } from '../activity/activity.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Multer } from 'multer';

describe('AttachmentsService Security', () => {
  let service: AttachmentsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      issue: {
        findUnique: vi.fn(),
      },
      attachment: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
    };

    const mockStorage = {
      saveFile: vi.fn(),
      getFileStream: vi.fn(),
      deleteFile: vi.fn(),
    };

    const mockActivity = {
      createActivity: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LocalStorageService, useValue: mockStorage },
        { provide: ActivityService, useValue: mockActivity },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockProjectId = 'project-1';
  const mockIssueId = 'issue-1';
  const mockActorId = 'user-1';
  const mockFile = {
    originalname: 'test.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('test'),
  } as Multer.File;

  describe('IDOR & cross-project authorization', () => {
    it('should throw NotFoundException if issue does not exist during upload', async () => {
      prisma.issue.findUnique.mockResolvedValue(null);

      await expect(
        service.upload(mockProjectId, mockIssueId, mockActorId, mockFile),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if issue belongs to a different project during upload', async () => {
      prisma.issue.findUnique.mockResolvedValue({
        projectId: 'different-project',
      } as any);

      await expect(
        service.upload(mockProjectId, mockIssueId, mockActorId, mockFile),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow upload if issue belongs to the correct project', async () => {
      prisma.issue.findUnique.mockResolvedValue({
        projectId: mockProjectId,
      } as any);
      prisma.attachment.create.mockResolvedValue({ id: 'attach-1' } as any);

      await expect(
        service.upload(mockProjectId, mockIssueId, mockActorId, mockFile),
      ).resolves.toBeDefined();
    });

    it('should throw ForbiddenException if issue belongs to a different project during findAll', async () => {
      prisma.issue.findUnique.mockResolvedValue({
        projectId: 'different-project',
      } as any);

      await expect(service.findAll(mockProjectId, mockIssueId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if issue belongs to a different project during getDownloadInfo', async () => {
      prisma.issue.findUnique.mockResolvedValue({
        projectId: 'different-project',
      } as any);

      await expect(
        service.getDownloadInfo(mockProjectId, mockIssueId, 'attach-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if issue belongs to a different project during delete', async () => {
      prisma.issue.findUnique.mockResolvedValue({
        projectId: 'different-project',
      } as any);

      await expect(
        service.delete(mockProjectId, mockIssueId, 'attach-1', mockActorId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
