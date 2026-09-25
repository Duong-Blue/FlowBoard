import { IsString, IsOptional } from 'class-validator';

export class CreateTransitionDto {
  @IsOptional()
  @IsString()
  fromStatusId?: string | null;

  @IsString()
  toStatusId: string;

  @IsOptional()
  @IsString()
  name?: string;
}
