import { IsNotEmpty } from 'class-validator';

export class AcceptInvitationDto {
  @IsNotEmpty()
  token: string;
}
