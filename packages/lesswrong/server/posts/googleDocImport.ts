import { OAuth2Client } from 'google-auth-library';
import { googleClientIdSetting, googleOAuthSecretSetting } from '../authenticationMiddlewares';
import { DatabaseServerSetting } from '../databaseSettings';
import { google } from 'googleapis';
import { extractGoogleDocId } from '../../lib/collections/posts/helpers';

export const gdocImportEmailTokenSetting = new DatabaseServerSetting<string | null>('gdocImportEmail.refreshToken', null)

let _oAuthClient: OAuth2Client | null = null;
let _cacheTimestamp: number | null = null;

/**
 * Get an OAuth2Client with the credentials set to the service account used for importing google docs
 */
export function getGoogleDocImportOAuthClient() {
  const ttl = 600000; // 10 minutes in milliseconds
  const currentTime = Date.now();

  // Check if we have a cached client and if it's still valid
  if (_oAuthClient && _cacheTimestamp && currentTime - _cacheTimestamp < ttl) {
    return _oAuthClient;
  }

  // If we don't have a valid cached client, create a new one
  const googleClientId = googleClientIdSetting.get();
  const googleOAuthSecret = googleOAuthSecretSetting.get();
  const gdocImportEmailToken = gdocImportEmailTokenSetting.get();

  if (!googleClientId || !googleOAuthSecret || !gdocImportEmailToken) {
    throw new Error('Google OAuth client or import email token not configured');
  }

  const oauth2Client = new OAuth2Client(googleClientId, googleOAuthSecret);
  oauth2Client.setCredentials({ refresh_token: gdocImportEmailToken });

  // Update the cache
  _oAuthClient = oauth2Client;
  _cacheTimestamp = currentTime;

  return oauth2Client;
}

/**
 * Check if we have access to the given doc via the service account
 */
export async function canAccessGoogleDoc(fileUrl: string): Promise<boolean> {
  const fileId = extractGoogleDocId(fileUrl)

  if (!fileId) {
    return false;
  }

  try {
    const oauth2Client = getGoogleDocImportOAuthClient();
    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Attempt to retrieve the file's metadata
    await drive.files.get({
      fileId,
      fields: 'name'
    });

    // If the metadata can be fetched, assume access to the document is available
    return true;
  } catch (error) {
    // If an error occurs, access is not available
    return false;
  }
}
