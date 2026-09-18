import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeGateway, RealtimeService],
})
export class RealtimeModule {}
