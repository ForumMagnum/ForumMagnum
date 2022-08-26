import { useQuery } from '../../lib/crud/useQuery';
import { getFragment } from '../../lib/vulcan-lib';

export const useContinueReading = () => {
  const { data, loading, error } = useQuery("ContinueReadingQuery", {
    ssr: true,
  });
  
  return {
    continueReading: data?.ContinueReading,
    loading, error
  };
}
