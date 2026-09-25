import { IsString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { IssueStatus } from '@prisma/client';

export class CreateStatusDto {
  @IsString()
  name: string;

  @IsEnum(IssueStatus)
  category: IssueStatus;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  color?: string;
}
