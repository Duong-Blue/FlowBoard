import { IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class TransitionItemDto {
  @IsOptional()
  @IsString()
  fromStatusId?: string | null;

  @IsString()
  toStatusId: string;
}

export class UpdateTransitionsMatrixDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransitionItemDto)
  transitions: TransitionItemDto[];
}
