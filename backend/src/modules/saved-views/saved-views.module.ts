import { Module } from '@nestjs/common';
import { SavedViewsService } from './saved-views.service';
import { SavedViewsController } from './saved-views.controller';
import { ProjectMembersModule } from '../project-members/project-members.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProjectMembersModule, AuthModule],
  controllers: [SavedViewsController],
  providers: [SavedViewsService],
})
export class SavedViewsModule {}
