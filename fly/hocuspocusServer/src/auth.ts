import jwt from 'jsonwebtoken';
import type { onAuthenticatePayload } from '@hocuspocus/server';
import { documentNamePrefixForCollection } from './documentNames';

type AccessLevel = 'none' | 'read' | 'comment' | 'edit';

const e2eDebug = process.env.E2E === 'true';

export interface AuthPayload {
  userId: string;
  displayName: string;
  collectionName: string;
  documentId: string;
  accessLevel: AccessLevel;
  exp: number;
}

export async function verifyAuthToken(token: string): Promise<AuthPayload> {
  // Must match HOCUSPOCUS_JWT_SECRET used in the main app's postResolvers.ts.
  const payload = jwt.verify(token, process.env.HOCUSPOCUS_JWT_SECRET!) as AuthPayload;

  if (payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  if (!payload.collectionName || !payload.documentId) {
    throw new Error('Token missing collectionName/documentId');
  }

  return payload;
}

export interface ConnectionContext {
  user: {
    id: string;
    name: string;
    accessLevel: AccessLevel;
    canEdit: boolean;
  };
}

/**
 * Hocuspocus `onAuthenticate` handler. Verifies the token, checks that it was
 * issued for this document (or one of its subdocuments), and marks the
 * connection read-only unless the token grants write access.
 */
export async function authenticateConnection({
  token,
  documentName,
  connectionConfig,
}: Pick<onAuthenticatePayload, 'token' | 'documentName' | 'connectionConfig'>): Promise<ConnectionContext> {
  if (!token) {
    throw new Error('Authentication required');
  }

  const payload = await verifyAuthToken(token);

  const { userId, displayName, accessLevel, collectionName, documentId } = payload;
  if (e2eDebug) {
    // eslint-disable-next-line no-console
    console.error('[e2e:hocuspocus] authenticate', { documentName, collectionName, documentId, userId, accessLevel });
  }

  if (accessLevel === 'none') {
    throw new Error('Access denied');
  }

  const expected = `${documentNamePrefixForCollection(collectionName)}${documentId}`;
  if (documentName !== expected && !documentName.startsWith(`${expected}/`)) {
    throw new Error(`Access denied: token for ${collectionName} ${documentId} cannot access document ${documentName}`);
  }

  // Allow both 'edit' and 'comment' users to write to the document.
  // 'comment' users are forced into suggestion mode on the client side, but
  // nothing here enforces that, so a 'comment' token can make direct edits.
  const canEdit = accessLevel === 'edit' || accessLevel === 'comment';

  // Hocuspocus discards Yjs updates from read-only connections before applying
  // them. This is the only place read-only access can be enforced: hooks like
  // onChange run after an update has already been applied and broadcast to the
  // document's other connections, so throwing from them doesn't reject it.
  connectionConfig.readOnly = !canEdit;

  return {
    user: {
      id: userId,
      name: displayName,
      accessLevel,
      canEdit,
    },
  };
}
