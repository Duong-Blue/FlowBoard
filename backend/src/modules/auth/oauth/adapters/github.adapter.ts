import { OAuthProviderAdapter, OAuthProfile } from '../interfaces/oauth-provider.interface';
import { oauthConfig } from '../oauth.config';

export class GitHubAdapter implements OAuthProviderAdapter {
  private get config() {
    return oauthConfig.github;
  }
  private readonly authUrl = 'https://github.com/login/oauth/authorize';
  private readonly tokenUrl = 'https://github.com/login/oauth/access_token';
  private readonly apiUrl = 'https://api.github.com';

  getAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'read:user user:email',
      state,
      // Note: GitHub added support for PKCE recently, although some older docs might omit it.
      // We send it to be compliant.
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<OAuthProfile> {
    // 1. Exchange code for access_token
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
      // GitHub supports code_verifier if code_challenge was provided
      code_verifier: codeVerifier,
    });

    const tokenResponse = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json' 
      },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`GitHub token error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    const profileResponse = await fetch(`${this.apiUrl}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FlowBoard-OAuth',
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`GitHub profile fetch failed: ${profileResponse.statusText}`);
    }

    const profileData = await profileResponse.json();

    // 3. Fetch user emails
    const emailsResponse = await fetch(`${this.apiUrl}/user/emails`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FlowBoard-OAuth',
      },
    });

    if (!emailsResponse.ok) {
      throw new Error(`GitHub emails fetch failed: ${emailsResponse.statusText}`);
    }

    const emailsData = await emailsResponse.json();

    // 4. Find primary, verified email
    const primaryVerifiedEmail = emailsData.find(
      (email: any) => email.primary === true && email.verified === true
    );

    if (!primaryVerifiedEmail) {
      throw new Error('GitHub account does not have a primary, verified email');
    }

    // GitHub's name is just a single string "name"
    const displayName = profileData.name || profileData.login;
    const parts = displayName.split(' ');
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;

    return {
      id: profileData.id.toString(),
      email: primaryVerifiedEmail.email,
      firstName,
      lastName,
      displayName,
      avatarUrl: profileData.avatar_url,
    };
  }
}
