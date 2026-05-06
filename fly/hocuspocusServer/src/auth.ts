import jwt from 'jsonwebtoken';

interface RawAuthPayload {
  userId: string;
  displayName: string;
  // Legacy field carried by JWTs issued before the collectionName migration.
  postId?: string;
  // New fields. JWTs issued after the migration carry both.
  collectionName?: string;
  documentId?: string;
  accessLevel: 'none' | 'read' | 'comment' | 'edit';
  exp: number;
}

export interface AuthPayload {
  userId: string;
  displayName: string;
  collectionName: string;
  documentId: string;
  accessLevel: 'none' | 'read' | 'comment' | 'edit';
  exp: number;
}

/**
 * Verify a Hocuspocus JWT and return its normalized payload.
 *
 * Backwards-compat: tokens issued before the collectionName migration carry
 * `{postId}` and no `collectionName`/`documentId`. Default missing values to
 * `('Posts', postId)` for the duration of the rollout window.
 */
export async function verifyAuthToken(token: string): Promise<AuthPayload> {
  // Verify JWT signed by your main app
  // Note: Must match HOCUSPOCUS_JWT_SECRET used in the main app's postResolvers.ts
  const payload = jwt.verify(token, process.env.HOCUSPOCUS_JWT_SECRET!) as RawAuthPayload;

  if (payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  const collectionName = payload.collectionName ?? 'Posts';
  const documentId = payload.documentId ?? payload.postId;
  if (!documentId) {
    throw new Error('Token missing documentId/postId');
  }

  return {
    userId: payload.userId,
    displayName: payload.displayName,
    collectionName,
    documentId,
    accessLevel: payload.accessLevel,
    exp: payload.exp,
  };
}
