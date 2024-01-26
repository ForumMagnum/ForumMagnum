import { useQuery } from '../../lib/crud/useQuery';

export const useContinueReading = (): {
  continueReading?: Array<{
    sequence: SequenceContinueReadingFragment,
    collection: CollectionContinueReadingFragment,
    nextPost: PostsList,
    numRead: number | null,
    numTotal: number | null,
    lastReadTime: Date | null,
  }>,
  loading: boolean,
  error: any,
}=> {  
  const { data, loading, error } = useQuery("ContinueReadingQuery", {
    ssr: true,
  });
  
  return {
    continueReading: data?.ContinueReading,
    loading, error
  };
}
