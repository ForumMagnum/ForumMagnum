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
