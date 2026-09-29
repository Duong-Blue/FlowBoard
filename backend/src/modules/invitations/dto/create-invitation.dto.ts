import { IsEmail, IsEnum } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(OrgRole)
  role: string;
}
