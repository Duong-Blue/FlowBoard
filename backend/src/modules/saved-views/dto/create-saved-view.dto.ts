import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNotEmpty,
} from 'class-validator';

export class CreateSavedViewDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  filterJson: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}
