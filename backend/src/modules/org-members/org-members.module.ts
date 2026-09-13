import { Module } from '@nestjs/common';
import { OrgMembersService } from './org-members.service';
import { OrgMembersController } from './org-members.controller';

@Module({
  controllers: [OrgMembersController],
  providers: [OrgMembersService],
  exports: [OrgMembersService],
})
export class OrgMembersModule {}
