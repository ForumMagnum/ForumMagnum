import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { navigateSearchHistory, SearchHistoryNavigation } from './searchHistoryNavigation';

const SearchHistoryQuery = gql(`
  query SearchHistory($userId: String!) {
    user(selector: {_id: $userId}) {
      result {
        _id
        searchHistory
      }
    }
  }
`);

const RecordSearchMutation = gql(`
  mutation RecordSearch($query: String!) {
    recordSearch(query: $query)
  }
`);

const ClearSearchHistoryMutation = gql(`
  mutation ClearSearchHistory {
    clearSearchHistory
  }
`);

export function useSearchHistory(userId: string | undefined, open: boolean) {
  const {data, refetch, error: queryError} = useQuery(SearchHistoryQuery, {
    variables: {userId: userId ?? ''},
    skip: !userId || !open,
    fetchPolicy: 'network-only',
  });
  const [recordSearchMutation] = useMutation(RecordSearchMutation);
  const [clearSearchHistoryMutation] = useMutation(ClearSearchHistoryMutation);
  const [error, setError] = useState(false);
  const [retryError, setRetryError] = useState(false);
  const navigation = useRef<SearchHistoryNavigation | null>(null);
  const history = data?.user?.result?._id === userId ? data?.user?.result?.searchHistory ?? [] : [];

  useEffect(() => {
    navigation.current = null;
    setError(false);
    setRetryError(false);
  }, [userId, open]);

  const resetNavigation = () => { navigation.current = null; };
  const recallSearch = (query: string, direction: 'ArrowUp' | 'ArrowDown') => {
    const result = navigateSearchHistory(navigation.current, history, query, direction);
    navigation.current = result.navigation;
    return result.query;
  };
  const recordSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!userId || !trimmedQuery || trimmedQuery.length > 1000) return;
    void recordSearchMutation({
      variables: {query: trimmedQuery},
      update: (cache, result) => {
        const cached = cache.readQuery({query: SearchHistoryQuery, variables: {userId}});
        if (!cached?.user?.result || !result.data) return;
        cache.writeQuery({
          query: SearchHistoryQuery,
          variables: {userId},
          data: {...cached, user: {...cached.user, result: {...cached.user.result, searchHistory: result.data.recordSearch}}},
        });
      },
    }).catch(() => setError(true));
  };
  const retryHistory = async () => {
    try {
      const result = await refetch();
      setRetryError(!!result.error);
    } catch {
      setRetryError(true);
    }
  };
  const clearHistory = async () => {
    try {
      await clearSearchHistoryMutation();
      resetNavigation();
      const result = await refetch();
      setRetryError(!!result.error);
      setError(false);
    } catch {
      setError(true);
    }
  };

  return {recallSearch, recordSearch, resetNavigation, clearHistory, retryHistory, hasHistory: history.length > 0, error, readError: !!userId && open && (!!queryError || retryError)};
}
