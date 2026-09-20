import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageService } from './local-storage.service';
import { BadRequestException } from '@nestjs/common';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = new LocalStorageService();
  });

  it('should reject path traversal attempts', () => {
    expect(() => service['resolvePath']('../../etc/passwd'))
      .toThrow(BadRequestException);
  });

  it('should resolve safe paths', () => {
    expect(() => service['resolvePath']('safe/file.txt'))
      .not.toThrow();
  });
});
