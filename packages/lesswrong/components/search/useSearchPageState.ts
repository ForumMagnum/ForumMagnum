import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSubscribedLocation } from '@/lib/routeUtil';
import { SearchPageState, searchPageStateFromSearch, mergeSearchPageParams } from './searchPageUrl';

/** Owns only the URL parameters belonging to this search presentation. */
export function useSearchPageState(presentation: 'page' | 'modal') {
  const navigate = useNavigate();
  const {location} = useSubscribedLocation();
  const writtenSearch = useRef<string | null>(null);
  const observedSearch = useRef(location.search);
  const openedPathname = useRef(location.pathname);
  const [state, setState] = useState<SearchPageState>(() =>
    searchPageStateFromSearch(location.search, presentation));
  // External navigation wins before writing local refinements back to the URL.
  useEffect(() => {
    // A destination URL controls its own modal and search state. Leave it untouched.
    if (presentation === 'modal' && location.pathname !== openedPathname.current) return;
    if (location.search !== observedSearch.current) {
      observedSearch.current = location.search;
      if (location.search !== writtenSearch.current) {
        setState(searchPageStateFromSearch(location.search, presentation));
        return;
      }
    }
    const search = mergeSearchPageParams(location.search, state, presentation);
    const targetSearch = search ? `?${search}` : "";
    writtenSearch.current = targetSearch;
    if (location.search !== targetSearch) navigate({...location, search}, {replace: true, skipRouter: true});
  // Read the current location snapshot whenever search state or the URL changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, navigate, location.search, location.pathname, presentation]);

  return {state, setState};
}
