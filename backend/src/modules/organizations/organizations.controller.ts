import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './create-organization.dto';
import { UpdateOrganizationDto } from './update-organization.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateOrganizationDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.service.findAllForUser(req.user.id);
  }

  @UseGuards(OrgMemberGuard)
  @Get(':orgId')
  findOne(@Param('orgId') orgId: string, @Req() req) {
    return this.service.findOne(orgId, req.user.id);
  }

  @UseGuards(OrgMemberGuard)
  @Patch(':orgId')
  update(@Param('orgId') orgId: string, @Req() req, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(orgId, req.user.id, dto);
  }

  @UseGuards(OrgMemberGuard)
  @Delete(':orgId')
  delete(@Param('orgId') orgId: string, @Req() req) {
    return this.service.delete(orgId, req.user.id);
  }
}
