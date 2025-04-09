import { useQuery } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { gql } from '@/lib/generated/gql-codegen/gql';

export interface ContinueReading {
  sequence: SequenceContinueReadingFragment,
  collection: CollectionContinueReadingFragment,
  nextPost: PostsListWithVotes,
  numRead: number,
  numTotal: number,
  lastReadTime: Date,
}

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

export const useContinueReading = (): {
  continueReading: ContinueReading[],
  loading: boolean,
  error: any,
}=> {
  
  
  const { data, loading, error } = useQuery(continueReadingQuery, {
    ssr: true,
  });
  
  return {
    continueReading: data?.ContinueReading,
    loading, error
  };
}
