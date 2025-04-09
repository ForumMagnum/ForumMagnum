import { frag } from "@/lib/fragments/fragmentWrapper"

// The raw side comment cache objects are not actually visible to the client
// and are only used internally to generate the user facing `sideComments`
// field on the posts object. This fragment is used by the SQL fragments
// compiler to fetch the necessary fields for the resolver on the posts
// collection.
export const SideCommentCacheMinimumInfo = () => gql`
  fragment SideCommentCacheMinimumInfo on SideCommentCache {
    _id
    postId
    annotatedHtml
    commentsByBlock
    version
    createdAt
  }
`
