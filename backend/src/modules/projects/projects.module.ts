import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [DatabaseModule, AuthModule, WorkflowsModule, ActivityModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
