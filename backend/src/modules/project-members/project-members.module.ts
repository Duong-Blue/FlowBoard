import { Module } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersController } from './project-members.controller';
import { DatabaseModule } from '../../database/database.module';
import { OrgMembersModule } from '../org-members/org-members.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProjectMembersController],
  providers: [ProjectMembersService],
})
export class ProjectMembersModule {}
