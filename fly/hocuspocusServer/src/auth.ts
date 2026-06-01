import jwt from 'jsonwebtoken';

type AccessLevel = 'none' | 'read' | 'comment' | 'edit';

interface RawAuthPayload {
  userId: string;
  displayName: string;
  // postId is the pre-migration field; collectionName/documentId are the new
  // ones. Tokens minted during the rollout window may carry only postId.
  postId?: string;
  collectionName?: string;
  documentId?: string;
  accessLevel: AccessLevel;
  exp: number;
}

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
