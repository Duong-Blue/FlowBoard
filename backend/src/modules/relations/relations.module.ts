import { Module } from '@nestjs/common';
import { RelationsService } from './relations.service';
import { RelationsController } from './relations.controller';
import { DatabaseModule } from '../../database/database.module';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, ActivityModule, AuthModule],
  controllers: [RelationsController],
  providers: [RelationsService],
  exports: [RelationsService],
})
export class RelationsModule {}
