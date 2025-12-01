import { gql } from '@/lib/generated/gql-codegen';

export const CollectionsPageFragmentQuery = gql(`
  query CollectionsPage($documentId: String) {
    collection(input: { selector: { documentId: $documentId } }) {
      result {
        ...CollectionsPageFragment
      }
    }
  }
`);

export const PostsSequenceMetadataQuery = gql(`
  query PostsSequenceMetadataQuery($selector: PostSelector!) {
    posts(selector: $selector) {
      results {
        ...PostsList
      }
    }
  }
`);
