import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { STORAGE_SERVICE } from './storage.interface';

@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: LocalStorageService,
    },
    LocalStorageService,
  ],
  exports: [STORAGE_SERVICE, LocalStorageService],
})
export class StorageModule {}
