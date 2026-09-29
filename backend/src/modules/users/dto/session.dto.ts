import { IsString, IsNotEmpty } from 'class-validator';

export class SessionQueryDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class SessionResponseDto {
  familyId: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}
