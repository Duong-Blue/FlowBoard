
import { Module } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssuesController, BoardController } from './issues.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [DatabaseModule, AuthModule, CommentsModule, ActivityModule],
  controllers: [IssuesController, BoardController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
