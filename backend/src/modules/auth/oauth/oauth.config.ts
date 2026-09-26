export const oauthConfig = {
  google: {
    _clientId: '',
    get clientId() {
      return this._clientId || process.env.GOOGLE_CLIENT_ID || '';
    },
    set clientId(val: string) {
      this._clientId = val;
    },
    _clientSecret: '',
    get clientSecret() {
      return this._clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
    },
    set clientSecret(val: string) {
      this._clientSecret = val;
    },
    _redirectUri: '',
    get redirectUri() {
      return (
        this._redirectUri ||
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/api/auth/oauth/google/callback'
      );
    },
    set redirectUri(val: string) {
      this._redirectUri = val;
    },
  },
  github: {
    _clientId: '',
    get clientId() {
      return this._clientId || process.env.GITHUB_CLIENT_ID || '';
    },
    set clientId(val: string) {
      this._clientId = val;
    },
    _clientSecret: '',
    get clientSecret() {
      return this._clientSecret || process.env.GITHUB_CLIENT_SECRET || '';
    },
    set clientSecret(val: string) {
      this._clientSecret = val;
    },
    _redirectUri: '',
    get redirectUri() {
      return (
        this._redirectUri ||
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/api/auth/oauth/github/callback'
      );
    },
    set redirectUri(val: string) {
      this._redirectUri = val;
    },
  },
};
