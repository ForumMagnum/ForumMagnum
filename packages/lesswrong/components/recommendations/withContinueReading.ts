import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';

export const useContinueReading = (): {
  continueReading: Array<{
    sequence: SequenceContinueReadingFragment,
    collection: CollectionContinueReadingFragment,
    nextPost: PostsList,
    numRead: number,
    numTotal: number,
    lastReadTime: Date,
  }>,
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
          ...PostsList
        }
        numRead
        numTotal
        lastReadTime
      }
    }
    ${fragmentTextForQuery(["SequenceContinueReadingFragment","CollectionContinueReadingFragment","PostsList"])}
  `;
  
  const { data, loading, error } = useQuery(continueReadingQuery, {
    ssr: true,
  });
  
  return {
    continueReading: data?.ContinueReading,
    loading, error
  };
}
