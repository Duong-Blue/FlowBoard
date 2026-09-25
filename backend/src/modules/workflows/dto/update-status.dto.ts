import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateStatusDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  color?: string;
}
