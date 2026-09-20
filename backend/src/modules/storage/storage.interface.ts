import { Readable } from 'stream';

export interface StorageService {
  saveFile(fileBuffer: Buffer, relativePath: string): Promise<string>;
  getFileStream(storagePath: string): Promise<Readable>;
  deleteFile(storagePath: string): Promise<boolean>;
  exists(storagePath: string): Promise<boolean>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
