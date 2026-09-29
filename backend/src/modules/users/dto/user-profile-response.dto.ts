export class UserProfileResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  theme: string;
  language: string;
  isActive: boolean;
  createdAt: Date;
  hasPassword: boolean;
  oauthProviders: string[];
}
