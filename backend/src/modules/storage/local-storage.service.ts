import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { createReadStream } from 'fs';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly basePath = path.resolve(process.cwd(), 'storage/uploads');

  constructor() {
    fs.mkdir(this.basePath, { recursive: true }).catch(() => {});
  }

  private resolvePath(relativePath: string): string {
    const resolved = path.resolve(this.basePath, relativePath);
    if (!resolved.startsWith(this.basePath)) {
      throw new BadRequestException('Invalid storage path');
    }
    return resolved;
  }

  async saveFile(fileBuffer: Buffer, relativePath: string): Promise<string> {
    const filePath = this.resolvePath(relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, fileBuffer);
    return relativePath;
  }

  async getFileStream(storagePath: string): Promise<Readable> {
    const filePath = this.resolvePath(storagePath);
    if (!(await this.exists(storagePath))) {
      throw new Error('File not found');
    }
    return createReadStream(filePath);
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    const filePath = this.resolvePath(storagePath);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const filePath = this.resolvePath(storagePath);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
