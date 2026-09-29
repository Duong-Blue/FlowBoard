import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum SearchEntityType {
  ISSUE = 'ISSUE',
  PROJECT = 'PROJECT',
  USER = 'USER',
}

export enum SearchSortBy {
  RELEVANCE = 'relevance',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRIORITY = 'priority',
  DUE_DATE = 'dueDate',
}

export enum SearchSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  orgId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsEnum(SearchEntityType)
  type?: SearchEntityType = SearchEntityType.ISSUE;

  @IsOptional()
  @IsUUID()
  workflowStatusId?: string;

  @IsOptional()
  @IsIn(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'])
  statusCategory?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  @IsIn(['BUG', 'FEATURE', 'TASK', 'SUBTASK', 'EPIC'])
  issueType?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(SearchSortBy)
  sortBy?: SearchSortBy;

  @IsOptional()
  @IsEnum(SearchSortOrder)
  sortOrder?: SearchSortOrder;
}
