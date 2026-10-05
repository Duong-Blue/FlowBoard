import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class CreateMilestoneDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
