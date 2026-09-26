import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuthService } from '../auth.service';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  hashToken,
  validateReturnTo,
} from './oauth-security.util';
import { GitHubAdapter } from './adapters/github.adapter';
import { GoogleAdapter } from './adapters/google.adapter';
import { OAuthProvider } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private githubAdapter: GitHubAdapter,
    private googleAdapter: GoogleAdapter,
  ) {}

  private getAdapter(provider: string) {
    if (provider === 'github') return this.githubAdapter;
    if (provider === 'google') return this.googleAdapter;
    throw new BadRequestException('Unsupported OAuth provider');
  }

  async beginFlow(providerName: string, returnTo?: string) {
    const adapter = this.getAdapter(providerName);
    const provider = providerName.toUpperCase() as OAuthProvider;
    const safeReturnTo = validateReturnTo(returnTo);

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    const state = generateState();
    const stateHash = hashToken(state);

    await this.prisma.oAuthFlow.create({
      data: {
        stateHash,
        provider,
        codeVerifier,
        returnTo: safeReturnTo,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    const url = adapter.getAuthorizationUrl(state, codeChallenge);
    return { url };
  }

  async handleCallback(providerName: string, code: string, state: string): Promise<{ error?: string; email?: string; code?: string }> {
    const stateHash = hashToken(state);

    const flow = await this.prisma.oAuthFlow.findUnique({
      where: { stateHash },
    });

    if (!flow || flow.consumedAt || flow.expiresAt < new Date()) {
      return { error: 'invalid_state' };
    }

    // Atomically consume
    const consumedFlow = await this.prisma.oAuthFlow.update({
      where: { id: flow.id, consumedAt: null },
      data: { consumedAt: new Date() },
    }).catch(() => null);

    if (!consumedFlow) {
      return { error: 'invalid_state' };
    }

    const adapter = this.getAdapter(providerName);
    let profile;
    try {
      profile = await adapter.exchangeCode(code, flow.codeVerifier);
    } catch (e) {
      return { error: 'exchange_failed' };
    }

    if (!profile.email) {
      return { error: 'missing_email' };
    }

    // Transactional account resolution
    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({
        where: {
          oauthAccounts: {
            some: {
              provider: flow.provider,
              providerAccountId: profile.id,
            },
          },
        },
      });

      if (!user) {
        user = await tx.user.findUnique({
          where: { email: profile.email },
        });

        if (user) {
          // Exists but no OAuth account for this provider
          return { error: 'account_conflict', email: profile.email };
        }

        // Create new user
        user = await tx.user.create({
          data: {
            email: profile.email,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            emailVerifiedAt: new Date(),
            oauthAccounts: {
              create: {
                provider: flow.provider,
                providerAccountId: profile.id,
                providerEmail: profile.email,
              },
            },
          },
        });
      }

      const rawCode = randomBytes(32).toString('hex');
      const codeHash = hashToken(rawCode);

      await tx.oAuthExchangeCode.create({
        data: {
          codeHash,
          userId: user.id,
          returnTo: flow.returnTo,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
      });

      return { code: rawCode };
    });
  }

  async exchangeCode(code: string) {
    const codeHash = hashToken(code);

    const exchangeData = await this.prisma.oAuthExchangeCode.update({
      where: { codeHash, consumedAt: null },
      data: { consumedAt: new Date() },
    }).catch(() => null);

    if (!exchangeData || exchangeData.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired exchange code');
    }

    await this.prisma.user.update({
      where: { id: exchangeData.userId },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.authService.issueSessionTokens(exchangeData.userId);
    return {
      ...tokens,
      returnTo: exchangeData.returnTo,
    };
  }
}
