import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSubscribedLocation } from '@/lib/routeUtil';
import { SearchPageState, searchPageStateFromSearch, mergeSearchPageParams } from './searchPageUrl';

// Typing changes the state on every keystroke; Safari throws after 100 replaceState calls in 30 seconds
const urlWriteDelayMs = 300;

export function useSearchPageState(presentation: 'page' | 'modal') {
  const navigate = useNavigate();
  const {location} = useSubscribedLocation();
  const writtenSearch = useRef<string | null>(null);
  const observedSearch = useRef(location.search);
  const openedPathname = useRef(location.pathname);
  const pendingWrite = useRef<(() => void) | null>(null);
  const [state, setState] = useState<SearchPageState>(() =>
    searchPageStateFromSearch(location.search, presentation));
  useEffect(() => {
    pendingWrite.current = null;
    if (presentation === 'modal' && location.pathname !== openedPathname.current) return;
    if (location.search !== observedSearch.current) {
      observedSearch.current = location.search;
      if (location.search !== writtenSearch.current) {
        setState(searchPageStateFromSearch(location.search, presentation));
        return;
      }
    }
    const search = mergeSearchPageParams(location.search, state, presentation);
    if (location.search === (search ? `?${search}` : "")) return;
    const write = () => {
      pendingWrite.current = null;
      if (window.location.pathname !== openedPathname.current) return;
      const current = mergeSearchPageParams(window.location.search, state, presentation);
      writtenSearch.current = current ? `?${current}` : "";
      navigate(({pathname, hash}) => ({pathname, hash, search: current}), {replace: true, skipRouter: true});
    };
    pendingWrite.current = write;
    const timer = setTimeout(write, urlWriteDelayMs);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, navigate, location.search, location.pathname, presentation]);
  // Closing the modal keeps the last keystrokes in the URL, so reopening it restores them
  useEffect(() => () => pendingWrite.current?.(), []);

  return {state, setState};
}
