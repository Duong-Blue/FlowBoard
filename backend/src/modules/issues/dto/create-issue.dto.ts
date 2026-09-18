import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { IssueStatus, IssuePriority, IssueType } from '@prisma/client';

export class CreateIssueDto {
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
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
