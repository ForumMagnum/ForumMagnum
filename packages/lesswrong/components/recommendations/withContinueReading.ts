import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';

export const useContinueReading = () => {
  const continueReadingQuery = gql(`
    query ContinueReadingQuery {
      ContinueReading {
        sequence {
          ...SequenceContinueReadingFragment
        }
        collection {
          ...CollectionContinueReadingFragment
        }
        nextPost {
          ...PostsListWithVotes
        }
        numRead
        numTotal
        lastReadTime
      }
    }
  `);
  
  const { data, loading, error } = useQuery(continueReadingQuery, {
    ssr: true,
  });
  
  return {
    continueReading: data?.ContinueReading ?? [],
    loading, error
  };
}
