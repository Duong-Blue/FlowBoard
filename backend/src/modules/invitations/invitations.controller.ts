import { Controller, Post, Body, Get, Param, UseGuards, Delete } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('organizations/:orgId/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Post()
  create(@Param('orgId') orgId: string, @CurrentUser('id') userId: string, @Body() dto: CreateInvitationDto) {
    return this.invitationsService.create(orgId, userId, dto);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Get()
  findPending(@Param('orgId') orgId: string) {
    return this.invitationsService.findPending(orgId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Delete(':id')
  revoke(@Param('orgId') orgId: string, @Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.invitationsService.revoke(orgId, id, userId);
  }

  @Post('accept')
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.accept(dto.token);
  }
}
