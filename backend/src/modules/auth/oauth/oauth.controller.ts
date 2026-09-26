import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  Redirect,
} from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { Response } from 'express';
import { OAuthExchangeDto } from '../dto/oauth-exchange.dto';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

@Controller('auth/oauth')
export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  @Get(':provider')
  async beginFlow(
    @Param('provider') provider: string,
    @Query('returnTo') returnTo: string,
    @Res() res: Response,
  ) {
    const { url } = await this.oauthService.beginFlow(provider, returnTo);
    res.redirect(url);
  }

  @Get(':provider/callback')
  async handleCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    if (error) {
      return res.redirect(
        `${FRONTEND_URL}/oauth/callback?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${FRONTEND_URL}/oauth/callback?error=invalid_request`,
      );
    }

    const result = await this.oauthService.handleCallback(
      provider,
      code,
      state,
    );

    if (result.error) {
      let redirectUrl = `${FRONTEND_URL}/oauth/callback?error=${encodeURIComponent(
        result.error,
      )}`;
      if (result.email) {
        redirectUrl += `&email=${encodeURIComponent(result.email)}`;
      }
      return res.redirect(redirectUrl);
    }

    return res.redirect(`${FRONTEND_URL}/oauth/callback?code=${result.code}`);
  }

  @Post('exchange')
  async exchangeCode(@Body() dto: OAuthExchangeDto) {
    return this.oauthService.exchangeCode(dto.code);
  }
}
