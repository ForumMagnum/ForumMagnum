import jwt from "jsonwebtoken";

/**
 * Issue a Hocuspocus session JWT for a ResearchDocument. Mirrors the token
 * issuance in `HocuspocusAuth` (postResolvers.ts:441) but for the research
 * collection: the JWT carries `collectionName: 'ResearchDocuments'` so the
 * Hocuspocus server's JWT decoder (T1 #4) routes it to the right permission
 * lane.
 *
 * The sandbox-callback token has already authorized the call by the time we
 * reach here, so this helper does no further permission check — it's the
 * sandbox dispatcher's responsibility to ensure the document is in the
 * token's authorized project before calling.
 *
 * `accessLevel: 'edit'` is fixed for the agent path; user-facing
 * Hocuspocus auth (the future GraphQL resolver in T1 #3) decides per-user
 * access levels.
 */
export async function issueResearchDocumentHocuspocusToken({
  documentId,
  userId,
}: {
  documentId: string;
  userId: string;
}): Promise<string> {
  const secret = process.env.HOCUSPOCUS_JWT_SECRET;
  if (!secret) {
    throw new Error("HOCUSPOCUS_JWT_SECRET is not configured");
  }
  return jwt.sign(
    {
      userId,
      displayName: "Research Agent",
      collectionName: "ResearchDocuments",
      documentId,
      accessLevel: "edit",
    },
    secret,
    { expiresIn: "1h" },
  );
}
