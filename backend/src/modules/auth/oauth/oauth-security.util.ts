import * as crypto from 'crypto';

/**
 * Generates a high-entropy random string to be used as a PKCE code verifier.
 * The length is 43 characters (which is between the 43-128 requirement of RFC 7636).
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Creates a base64url-encoded SHA-256 hash of the code verifier.
 * @param verifier The code verifier string
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Generates a 32-byte crypto random string (hex encoded) for the state parameter
 * to mitigate CSRF attacks.
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a sha256 hex hash of a raw token (e.g., access token or refresh token)
 * for safe storage or comparison.
 * @param raw The raw token
 */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Validates the returnTo URL to prevent Open Redirect vulnerabilities.
 * It strictly allows only relative paths starting with `/workspace`.
 * 
 * @param returnTo The requested redirect path
 * @returns A safe relative path (defaults to `/workspace`)
 */
export function validateReturnTo(returnTo?: string): string {
  const defaultPath = '/workspace';
  
  if (!returnTo || typeof returnTo !== 'string') {
    return defaultPath;
  }

  // Reject anything that looks like an absolute URL or protocol-relative URL
  if (
    returnTo.startsWith('//') || 
    returnTo.startsWith('http://') || 
    returnTo.startsWith('https://') || 
    returnTo.startsWith('javascript:') ||
    returnTo.includes('://')
  ) {
    return defaultPath;
  }

  // It must explicitly start with `/workspace`
  if (!returnTo.startsWith('/workspace')) {
    return defaultPath;
  }
  
  // Reject path traversal attempts just to be safe
  if (returnTo.includes('../') || returnTo.includes('..\\')) {
    return defaultPath;
  }

  // Validate that if there's anything after /workspace, it's either a slash or a valid path
  // (e.g. we don't want to allow `/workspace.evil.com` if somehow misconfigured on the frontend later)
  if (returnTo.length > '/workspace'.length && returnTo[10] !== '/' && returnTo[10] !== '?') {
    return defaultPath;
  }

  return returnTo;
}
