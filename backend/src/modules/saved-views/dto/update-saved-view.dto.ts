import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
} from 'class-validator';

export class UpdateSavedViewDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  filterJson?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}
