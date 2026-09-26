export interface OAuthProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl?: string;
}

export interface OAuthProviderAdapter {
  /**
   * Generates the authorization URL to redirect the user to the provider.
   * @param state A random string to mitigate CSRF attacks
   * @param codeChallenge The PKCE code challenge
   */
  getAuthorizationUrl(state: string, codeChallenge: string): string;

  /**
   * Exchanges the authorization code for an access token and fetches the user's profile.
   * @param code The authorization code from the provider
   * @param codeVerifier The PKCE code verifier
   * @throws Error if the code exchange fails or the email is not verified
   */
  exchangeCode(code: string, codeVerifier: string): Promise<OAuthProfile>;
}
