import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageService } from './local-storage.service';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';

vi.mock('fs/promises');

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
    service = new LocalStorageService();
  });

  it('should reject path traversal attempts', () => {
    expect(() => service['resolvePath']('../../etc/passwd')).toThrow(
      BadRequestException,
    );
  });

  it('should resolve safe paths', () => {
    expect(() => service['resolvePath']('safe/file.txt')).not.toThrow();
  });

  it('should prevent deleting root storage directory', async () => {
    await expect(service.deleteDirectory('')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should delete a valid directory', async () => {
    vi.mocked(fs.rm).mockResolvedValueOnce(undefined);
    const result = await service.deleteDirectory('issues/123');
    expect(result).toBe(true);
    expect(fs.rm).toHaveBeenCalled();
  });

  it('should handleIssueDeleted by deleting the specific issue directory', async () => {
    vi.mocked(fs.rm).mockResolvedValueOnce(undefined);
    await service.handleIssueDeleted({ projectId: 'p1', issueId: 'iss-1' });
    expect(fs.rm).toHaveBeenCalledWith(expect.stringContaining('iss-1'), {
      recursive: true,
      force: true,
    });
  });

  it('should reject handleIssueDeleted on path traversal attempt', async () => {
    await service.handleIssueDeleted({ projectId: 'p1', issueId: '../iss-1' });
    expect(fs.rm).not.toHaveBeenCalled();
  });

  it('should return false when deleting a missing directory', async () => {
    vi.mocked(fs.rm).mockRejectedValueOnce(new Error('ENOENT'));
    const result = await service.deleteDirectory('issues/missing');
    expect(result).toBe(false);
  });

  it('should not delete directory if issueId is invalid or empty in handleIssueDeleted', async () => {
    await service.handleIssueDeleted({ projectId: 'p1', issueId: '' });
    expect(fs.rm).not.toHaveBeenCalled();
  });
});
