import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsEnum(OrgRole)
  role: OrgRole;
}
