import { IsEnum } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class UpdateProjectMemberRoleDto {
  @IsEnum(ProjectRole)
  role: ProjectRole;
}
