import { runQueryNonThrowing } from "@/server/vulcan-lib/query";
import { gql } from "@/lib/generated/gql-codegen";

const HocuspocusAuthQuery = gql(`
  query HocuspocusAuthQueryServer($collectionName: String, $documentId: String, $linkSharingKey: String) {
    HocuspocusAuth(collectionName: $collectionName, documentId: $documentId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`);

function isUnauthorizedHocuspocusError(message: string): boolean {
  return message.startsWith("Unauthorized:");
}

/**
 * Fetch a Hocuspocus auth token for a given Posts document.
 *
 * For non-Posts collections (e.g. ResearchDocuments) use
 * `getHocuspocusTokenForCollection` instead.
 */
export async function getHocuspocusToken(
  context: ResolverContext,
  postId: string,
  linkSharingKey?: string,
): Promise<string | null> {
  return getHocuspocusTokenForCollection(context, 'Posts', postId, linkSharingKey);
}

export async function getHocuspocusTokenForCollection(
  context: ResolverContext,
  collectionName: string,
  documentId: string,
  linkSharingKey?: string,
): Promise<string | null> {
  const { data, errors } = await runQueryNonThrowing(
    HocuspocusAuthQuery,
    { collectionName, documentId, linkSharingKey: linkSharingKey ?? null },
    context,
  );
  if (errors) {
    const unexpectedError = errors.find((error) => !isUnauthorizedHocuspocusError(error.message));
    if (unexpectedError) {
      throw new Error(unexpectedError.message);
    }
    return null;
  }
  return data?.HocuspocusAuth?.token ?? null;
}
