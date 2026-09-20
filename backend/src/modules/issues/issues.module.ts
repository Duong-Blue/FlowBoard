
import { Module } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssuesController, BoardController } from './issues.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { SubtasksService } from './subtasks.service';

@Module({
  imports: [DatabaseModule, AuthModule, CommentsModule, ActivityModule, NotificationsModule],
  controllers: [IssuesController, BoardController],
  providers: [IssuesService, SubtasksService],
  exports: [IssuesService, SubtasksService],
})
export class IssuesModule {}
