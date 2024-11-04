import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';

export interface ContinueReading {
  sequence: SequenceContinueReadingFragment,
  collection: CollectionContinueReadingFragment,
  nextPost: PostsListWithVotes,
  numRead: number,
  numTotal: number,
  lastReadTime: Date,
}

export const useContinueReading = (): {
  continueReading: ContinueReading[],
  loading: boolean,
  error: any,
}=> {
  const continueReadingQuery = gql`
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
    ${fragmentTextForQuery(["SequenceContinueReadingFragment","CollectionContinueReadingFragment","PostsListWithVotes"])}
  `;
  
  const { data, loading, error } = useQuery(continueReadingQuery, {
    ssr: true,
  });
  
  return {
    continueReading: data?.ContinueReading,
    loading, error
  };
}
