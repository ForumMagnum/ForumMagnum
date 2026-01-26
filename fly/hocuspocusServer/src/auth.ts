import jwt from 'jsonwebtoken';

interface AuthPayload {
  userId: string;
  displayName: string;
  postId: string;
  accessLevel: 'none' | 'read' | 'comment' | 'edit';
  exp: number;
}

export async function verifyAuthToken(token: string): Promise<AuthPayload> {
  // Verify JWT signed by your main app
  // Note: Must match HOCUSPOCUS_JWT_SECRET used in the main app's postResolvers.ts
  const payload = jwt.verify(token, process.env.HOCUSPOCUS_JWT_SECRET!) as AuthPayload;
  
  if (payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  return payload;
}
