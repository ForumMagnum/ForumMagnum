import { gql } from '@/lib/generated/gql-codegen';

export const PostsEditFormQuery = gql(`
  query PostsEditFormPost($documentId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsEditQueryFragment
      }
    }
  }
`);
