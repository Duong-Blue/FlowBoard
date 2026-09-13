import { Controller, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrgMembersService } from './org-members.service';
import { UpdateMemberRoleDto } from './update-member-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { OrgMemberGuard } from '../auth/guards/org-member.guard'; // ponytial: guard missing.

@UseGuards(JwtAuthGuard)
@Controller('organizations/:orgId/members')
export class OrgMembersController {
  constructor(private readonly service: OrgMembersService) {}

  @Get()
  findAll(@Param('orgId') orgId: string) {
    return this.service.findAll(orgId);
  }

  // @UseGuards(OrgMemberGuard)
  @Patch(':userId')
  updateRole(@Param('orgId') orgId: string, @Param('userId') targetUserId: string, @Req() req, @Body() dto: UpdateMemberRoleDto) {
    return this.service.updateRole(orgId, targetUserId, req.user.id, dto.role);
  }

  // @UseGuards(OrgMemberGuard)
  @Delete(':userId')
  remove(@Param('orgId') orgId: string, @Param('userId') targetUserId: string, @Req() req) {
    return this.service.remove(orgId, targetUserId, req.user.id);
  }
}
