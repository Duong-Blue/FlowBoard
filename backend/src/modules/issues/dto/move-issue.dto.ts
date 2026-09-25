import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IssueStatus } from '@prisma/client';

export class MoveIssueDto {
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsString()
  @IsUUID()
  targetWorkflowStatusId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  beforeIssueId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  afterIssueId?: string;
}
