import { runQuery } from "@/server/vulcan-lib/query";
import { gql } from "@/lib/generated/gql-codegen";
import { type CollaborativeEditingAccessLevel, isCollaborativeEditingAccessLevel } from "@/lib/collections/posts/collabEditingPermissions";

const HocuspocusAuthQuery = gql(`
  query HocuspocusAuthQueryServer($collectionName: String, $documentId: String, $linkSharingKey: String) {
    HocuspocusAuth(collectionName: $collectionName, documentId: $documentId, linkSharingKey: $linkSharingKey) {
      token
      accessLevel
    }
  }
`);

export interface HocuspocusAuth {
  token: string
  /** The access level the token grants; the Hocuspocus server enforces it. */
  accessLevel: CollaborativeEditingAccessLevel
}

/**
 * Fetch a Hocuspocus auth token, and the access level it grants, for a given
 * Posts document.
 *
 * For non-Posts collections (e.g. ResearchDocuments) use
 * `getHocuspocusAuthForCollection` instead.
 */
export async function getHocuspocusAuth(
  context: ResolverContext,
  postId: string,
  linkSharingKey?: string,
): Promise<HocuspocusAuth | null> {
  return getHocuspocusAuthForCollection(context, 'Posts', postId, linkSharingKey);
}

export async function getHocuspocusAuthForCollection(
  context: ResolverContext,
  collectionName: string,
  documentId: string,
  linkSharingKey?: string,
): Promise<HocuspocusAuth | null> {
  const { data } = await runQuery(
    HocuspocusAuthQuery,
    { collectionName, documentId, linkSharingKey: linkSharingKey ?? null },
    context,
  );
  const auth = data?.HocuspocusAuth;
  if (!auth) {
    return null;
  }
  if (!isCollaborativeEditingAccessLevel(auth.accessLevel)) {
    throw new Error(`HocuspocusAuth returned an unknown access level: ${auth.accessLevel}`);
  }
  return { token: auth.token, accessLevel: auth.accessLevel };
}
