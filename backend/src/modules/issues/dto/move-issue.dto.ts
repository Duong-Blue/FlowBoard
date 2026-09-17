import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IssueStatus } from '@prisma/client';

export class MoveIssueDto {
  @IsEnum(IssueStatus)
  status: IssueStatus;

  @IsOptional()
  @IsString()
  @IsUUID()
  beforeIssueId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  afterIssueId?: string;
}
