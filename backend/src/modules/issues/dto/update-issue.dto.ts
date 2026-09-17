import { IsOptional, IsString, IsEnum } from 'class-validator';
import { IssueStatus, IssuePriority } from '@prisma/client';

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
