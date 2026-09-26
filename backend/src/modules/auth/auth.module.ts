import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { OAuthService } from './oauth/oauth.service';
import { OAuthController } from './oauth/oauth.controller';
import { GitHubAdapter } from './oauth/adapters/github.adapter';
import { GoogleAdapter } from './oauth/adapters/google.adapter';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    AuthService,
    OAuthService,
    GitHubAdapter,
    GoogleAdapter,
  ],
  controllers: [AuthController, OAuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
