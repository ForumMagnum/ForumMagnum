import { runQuery } from "@/server/vulcan-lib/query";
import { gql } from "@/lib/generated/gql-codegen";

const HocuspocusAuthQuery = gql(`
  query HocuspocusAuthQueryServer($collectionName: String, $documentId: String, $linkSharingKey: String) {
    HocuspocusAuth(collectionName: $collectionName, documentId: $documentId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`);

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
  const { data } = await runQuery(
    HocuspocusAuthQuery,
    { collectionName, documentId, linkSharingKey: linkSharingKey ?? null },
    context,
  );
  return data?.HocuspocusAuth?.token ?? null;
}
