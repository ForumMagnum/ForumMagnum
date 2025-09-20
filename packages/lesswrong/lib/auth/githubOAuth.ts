import crypto from 'crypto';
import { githubClientIdSetting, githubOAuthSecretSetting, afGithubClientIdSetting, afGithubOAuthSecretSetting } from '@/server/databaseSettings';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';
import { isAF } from '@/lib/instanceSettings';

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getGitHubCredentials() {
  const clientId = isAF() ? afGithubClientIdSetting.get() : githubClientIdSetting.get();
  const clientSecret = isAF() ? afGithubOAuthSecretSetting.get() : githubOAuthSecretSetting.get();
  
  return { clientId, clientSecret };
}

export function getGitHubAuthUrl(state: string): string {
  const { clientId } = getGitHubCredentials();
  if (!clientId) throw new Error('GitHub OAuth not configured');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${getSiteUrl()}auth/github/callback`,
    scope: 'user:email',
    state: state,
  });

  return `${GITHUB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<GitHubTokenResponse> {
  const { clientId, clientSecret } = getGitHubCredentials();
  
  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${getSiteUrl()}auth/github/callback`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchGitHubUserProfile(accessToken: string): Promise<GitHubUserProfile> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchGitHubUserEmails(accessToken: string): Promise<GitHubEmail[]> {
  const response = await fetch(GITHUB_EMAILS_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user emails: ${response.statusText}`);
  }

  return response.json();
}

// GitHub doesn't always provide the primary email in the user profile
// So we need to fetch it from the emails endpoint
export async function getGitHubPrimaryEmail(accessToken: string): Promise<string | null> {
  const emails = await fetchGitHubUserEmails(accessToken);
  const primaryEmail = emails.find(e => e.primary && e.verified);
  return primaryEmail?.email || null;
}
