import { IsString, IsNotEmpty } from 'class-validator';

export class DeclineInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
