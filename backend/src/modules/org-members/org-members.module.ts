import { Module } from '@nestjs/common';
import { OrgMembersService } from './org-members.service';
import { OrgMembersController } from './org-members.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrgMembersController],
  providers: [OrgMembersService],
  exports: [OrgMembersService],
})
export class OrgMembersModule {}
