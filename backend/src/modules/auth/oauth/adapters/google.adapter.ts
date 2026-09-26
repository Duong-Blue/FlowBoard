import { OAuthProviderAdapter, OAuthProfile } from '../interfaces/oauth-provider.interface';
import { oauthConfig } from '../oauth.config';

export class GoogleAdapter implements OAuthProviderAdapter {
  private get config() {
    return oauthConfig.google;
  }
  private readonly authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';

  getAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<OAuthProfile> {
    // 1. Exchange code for access_token and id_token
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
    });

    const tokenResponse = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Google token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`Google profile fetch failed: ${profileResponse.statusText}`);
    }

    const profileData = await profileResponse.json();

    // 3. Verify email
    if (!profileData.email) {
      throw new Error('Google profile missing email');
    }

    if (profileData.email_verified !== true) {
      throw new Error('Google email is not verified');
    }

    return {
      id: profileData.sub,
      email: profileData.email,
      firstName: profileData.given_name,
      lastName: profileData.family_name,
      displayName: profileData.name || profileData.given_name || profileData.email,
      avatarUrl: profileData.picture,
    };
  }
}
