import { IsString, IsOptional } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  confirmation?: string;
}
