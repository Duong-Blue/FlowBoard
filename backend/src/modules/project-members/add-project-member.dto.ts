import { IsNotEmpty, IsEnum } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class AddProjectMemberDto {
  @IsNotEmpty()
  userId: string;

  @IsEnum(ProjectRole)
  role: ProjectRole;
}
