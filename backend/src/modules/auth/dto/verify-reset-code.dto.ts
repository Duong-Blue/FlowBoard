import { IsEmail, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyResetCodeDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
