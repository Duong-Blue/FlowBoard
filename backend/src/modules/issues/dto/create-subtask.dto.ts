import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { IssueStatus, IssuePriority } from '@prisma/client';

export class CreateSubtaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsString()
  workflowStatusId?: string;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
