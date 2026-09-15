import { IsNotEmpty, Matches, IsString, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{2,10}$/)
  key: string;

  @IsOptional()
  @IsString()
  description?: string;
}
