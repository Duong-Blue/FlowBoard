import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { IssueStatus } from '@prisma/client';

export class MoveIssueDto {
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o, value) => value !== null)
  targetWorkflowStatusId?: string | null;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o, value) => value !== null)
  beforeIssueId?: string | null;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o, value) => value !== null)
  afterIssueId?: string | null;
}
