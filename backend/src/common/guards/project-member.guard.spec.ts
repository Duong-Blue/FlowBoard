import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ProjectMemberGuard } from './project-member.guard';
import { PrismaService } from '../../database/prisma.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ProjectMemberGuard', () => {
  let guard: ProjectMemberGuard;
  let prismaService: PrismaService;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    prismaService = {
      project: {
        findFirst: vi.fn(),
      },
      projectMember: {
        findUnique: vi.fn(),
      },
    } as any;

    guard = new ProjectMemberGuard(prismaService);

    mockRequest = {
      params: {},
      user: {},
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  });

  it('should throw ForbiddenException if user is not authenticated', async () => {
    mockRequest.user = null;

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new ForbiddenException('User not authenticated'),
    );
  });

  it('should return true if no project param is provided', async () => {
    mockRequest.user = { id: 'user-1' };
    // No project param

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if project does not exist', async () => {
    mockRequest.user = { id: 'user-1' };
    mockRequest.params = { projectId: 'non-existent-project' };

    vi.mocked(prismaService.project.findFirst).mockResolvedValue(null);

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new ForbiddenException('Not a project member'),
    );
  });

  it('should throw ForbiddenException if user is not a member of the project', async () => {
    mockRequest.user = { id: 'user-1' };
    mockRequest.params = { projectId: 'project-1' };

    vi.mocked(prismaService.project.findFirst).mockResolvedValue({ id: 'project-id' } as any);
    vi.mocked(prismaService.projectMember.findUnique).mockResolvedValue(null);

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new ForbiddenException('Not a project member'),
    );
  });

  it('should return true and assign projectMember to request if user is a member', async () => {
    mockRequest.user = { id: 'user-1' };
    mockRequest.params = { projectId: 'project-1' };

    const mockMember = { projectId: 'project-id', userId: 'user-1', role: 'MEMBER' };
    vi.mocked(prismaService.project.findFirst).mockResolvedValue({ id: 'project-id' } as any);
    vi.mocked(prismaService.projectMember.findUnique).mockResolvedValue(mockMember as any);

    const result = await guard.canActivate(mockExecutionContext);
    
    expect(result).toBe(true);
    expect(mockRequest.projectMember).toEqual(mockMember);
  });

  it('should use project key if projectId is not provided but id is', async () => {
    mockRequest.user = { id: 'user-1' };
    mockRequest.params = { id: 'project-key' }; // e.g. for /projects/:id

    const mockMember = { projectId: 'project-id', userId: 'user-1', role: 'ADMIN' };
    vi.mocked(prismaService.project.findFirst).mockResolvedValue({ id: 'project-id' } as any);
    vi.mocked(prismaService.projectMember.findUnique).mockResolvedValue(mockMember as any);

    const result = await guard.canActivate(mockExecutionContext);
    
    expect(result).toBe(true);
    expect(prismaService.project.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ id: 'project-key' }, { key: { equals: 'project-key', mode: 'insensitive' } }] },
      select: { id: true },
    });
  });

  it('should reject access if user tries to access a project from another org (not a member)', async () => {
    mockRequest.user = { id: 'user-1' };
    mockRequest.params = { projectId: 'other-org-project' };

    vi.mocked(prismaService.project.findFirst).mockResolvedValue({ id: 'other-org-project-id' } as any);
    vi.mocked(prismaService.projectMember.findUnique).mockResolvedValue(null);

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new ForbiddenException('Not a project member'),
    );
  });

  it('should accept different roles (ADMIN, MEMBER, VIEWER) identically in guard logic', async () => {
    mockRequest.user = { id: 'user-1' };
    mockRequest.params = { projectId: 'project-1' };

    const roles = ['ADMIN', 'MEMBER', 'VIEWER'];
    
    for (const role of roles) {
      const mockMember = { projectId: 'project-id', userId: 'user-1', role };
      vi.mocked(prismaService.project.findFirst).mockResolvedValue({ id: 'project-id' } as any);
      vi.mocked(prismaService.projectMember.findUnique).mockResolvedValue(mockMember as any);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
      expect(mockRequest.projectMember).toEqual(mockMember);
    }
  });
});
