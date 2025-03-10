import { OAuth2Client } from 'google-auth-library';
import { DatabaseServerSetting } from '../databaseSettings';
import { extractGoogleDocId } from '../../lib/collections/posts/helpers';
import GoogleServiceAccountSessions from '../../lib/collections/googleServiceAccountSessions/collection';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { drive } from '@googleapis/drive';

export const googleDocImportClientIdSetting = new DatabaseServerSetting<string | null>('googleDocImport.oAuth.clientId', null)
export const googleDocImportClientSecretSetting = new DatabaseServerSetting<string | null>('googleDocImport.oAuth.secret', null)

let oAuth2Client: OAuth2Client | null = null;
let cacheTimestamp: number | null = null;

/**
 * Get an OAuth2Client with the credentials set to the service account used for importing google docs
 */
export async function getGoogleDocImportOAuthClient() {
  const ttl = 600000; // 10 minutes in milliseconds
  const currentTime = Date.now();

  if (oAuth2Client && cacheTimestamp && currentTime - cacheTimestamp < ttl) {
    return oAuth2Client;
  }

  const googleClientId = googleDocImportClientIdSetting.get();
  const googleOAuthSecret = googleDocImportClientSecretSetting.get();

  if (!googleClientId || !googleOAuthSecret) {
    throw new Error('Google OAuth client not configured');
  }

  const gdocImportEmailToken = await getActiveRefreshToken();

  const oauth2Client = new OAuth2Client(googleClientId, googleOAuthSecret);
  oauth2Client.setCredentials({ refresh_token: gdocImportEmailToken });

  // Update the cache
  oAuth2Client = oauth2Client;
  cacheTimestamp = currentTime;

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
    const oauth2Client = await getGoogleDocImportOAuthClient();
    const googleDrive = drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Attempt to retrieve the file's metadata
    await googleDrive.files.get({
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

async function getActiveRefreshToken() {
  const sessions = await GoogleServiceAccountSessions.find({active: true}).fetch()

  if (sessions.length !== 1) {
    throw new Error("There should only be one active GoogleServiceAccountSession")
  }

  return sessions[0].refreshToken
}

/**
 * Explicitly revoke all access tokens (where this hasn't been done already). This isn't necessary when updating
 * the active token, as previous tokens are automatically revoked, but we may want to do it for security reasons
 */
export async function revokeAllAccessTokens() {
  const googleClientId = googleDocImportClientIdSetting.get();
  const googleOAuthSecret = googleDocImportClientSecretSetting.get();

  if (!googleClientId || !googleOAuthSecret) {
    throw new Error('Google OAuth client not configured');
  }

  const oauth2Client = new OAuth2Client(googleClientId, googleOAuthSecret);

  const sessions = await GoogleServiceAccountSessions.find({revoked: false}).fetch()

  for (const session of sessions) {
    try {
      await oauth2Client.revokeToken(session.refreshToken);

      await updateMutator({
        collection: GoogleServiceAccountSessions,
        documentId: session._id,
        set: { active: false, revoked: true },
        validate: false
      });

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
    }
  }
}

export async function updateActiveServiceAccount({email, refreshToken}: {email: string, refreshToken: string}) {
  await GoogleServiceAccountSessions.rawUpdateMany({active: true}, {$set: {active: false}})

  await createMutator({
    collection: GoogleServiceAccountSessions,
    document: {
      email,
      refreshToken,
      // Now + 5 months (the earliest a token can expire is around 6 months)
      estimatedExpiry: new Date(Date.now() + (5 * 30 * 24 * 60 * 60 * 1000)),
      active: true,
      revoked: false
    },
    validate: false,
  })

  oAuth2Client = null;
  cacheTimestamp = null;
}
