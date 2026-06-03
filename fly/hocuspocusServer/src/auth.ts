import jwt from 'jsonwebtoken';

type AccessLevel = 'none' | 'read' | 'comment' | 'edit';

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
