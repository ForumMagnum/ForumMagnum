import { runQuery } from "@/server/vulcan-lib/query";
import { gql } from "@/lib/generated/gql-codegen";

const HocuspocusAuthQuery = gql(`
  query HocuspocusAuthQueryServer($collectionName: String, $documentId: String, $linkSharingKey: String) {
    HocuspocusAuth(collectionName: $collectionName, documentId: $documentId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`);

export async function getHocuspocusToken(context: ResolverContext, postId: string, linkSharingKey?: string): Promise<string | null> {
  const { data } = await runQuery(
    HocuspocusAuthQuery,
    { collectionName: 'Posts', documentId: postId, linkSharingKey: linkSharingKey ?? null },
    context,
  );
  return data?.HocuspocusAuth?.token ?? null;
}
