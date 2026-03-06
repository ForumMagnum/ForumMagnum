import { runQuery } from "@/server/vulcan-lib/query";
import { gql } from "@/lib/generated/gql-codegen";

const HocuspocusAuthQuery = gql(`
  query HocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`);

export async function getHocuspocusToken(context: ResolverContext, postId: string, linkSharingKey?: string): Promise<string | null> {
  const { data } = await runQuery(
    HocuspocusAuthQuery,
    { postId, linkSharingKey: linkSharingKey ?? null },
    context,
  );
  return data?.HocuspocusAuth?.token ?? null;
}
