import { IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { IssueStatus, IssuePriority } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class IssueQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['true', 'false'])
  @Transform(({ value }) => value === 'true')
  overdue?: boolean;

  @IsOptional()
  @IsEnum(['true', 'false'])
  @Transform(({ value }) => value === 'true')
  dueSoon?: boolean;

  @IsOptional()
  @IsEnum(['true', 'false'])
  @Transform(({ value }) => value === 'true')
  noDueDate?: boolean;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
