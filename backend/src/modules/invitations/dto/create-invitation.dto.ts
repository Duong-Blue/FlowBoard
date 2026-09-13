import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  role: string;
}
