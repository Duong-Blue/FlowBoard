import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  displayName?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  theme?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;
}
