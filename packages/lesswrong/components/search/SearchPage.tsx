"use client";
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import ChevronDoubleRightIcon from '@heroicons/react/20/solid/ChevronDoubleRightIcon';
import { usePathname } from 'next/navigation';
import { InstantSearch } from '@/lib/utils/componentsWithChildren';
import {
  SearchIndexCollectionName,
  getSearchClient,
  getSearchIndexName,
  isSearchEnabled,
} from '@/lib/search/searchUtil';
import { formatSearchSort } from '@/lib/search/searchSorting';
import { searchFiltersToParams, SearchFilterState } from '@/lib/search/searchFilters';
import { useSearchPageState } from './useSearchPageState';
import { searchPageStyles } from './searchPageStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';
import { useCurrentUser } from '../common/withUser';
import SearchPageResults from './SearchPageResults';
import SearchQueryInput from './SearchQueryInput';
import ForumIcon from '../common/ForumIcon';
import { useSearchAnalytics, useCaptureSearchResultSelected } from './useSearchAnalytics';
import { useSearchHistory } from './useSearchHistory';
import { useSearchPageNavigation } from './useSearchPageNavigation';
import { SearchBarHit, useSearchResults } from './useSearchResults';
import { defaultSearchPageState, searchPageStateToQuery } from './searchPageUrl';
import SearchKindBar, { searchKinds, toggleSearchKind } from './SearchKindBar';
import SearchPageFilters, { summarizeSearchFilters } from './SearchPageFilters';
import SearchTimeframeBar from './SearchTimeframeBar';
import SingleUsersItem from '../form-components/SingleUsersItem';

function indexNameForKinds(kinds: SearchIndexCollectionName[]): string {
  return searchKinds
    .filter(({type}) => !kinds.length || kinds.includes(type))
    .map(({type}) => getSearchIndexName(type))
    .join(",");
}

interface SearchPageProps {
  presentation?: 'page' | 'modal',
  onClose?: () => void,
  /** Where the modal shows the timeline on wide screens: above its dialog box instead of inside the search layout. */
  timeframeSlot?: HTMLElement | null,
  filterTabSlot?: HTMLElement | null,
}

const SearchPage = ({presentation = 'page', onClose, timeframeSlot: providedTimeframeSlot, filterTabSlot: providedFilterTabSlot}: SearchPageProps) => {
  // HACK: workaround for cacheComponents' background use of <Activity> breaking search in a lot of situations after navigation.
  const pathname = usePathname();
  const classes = useStyles(searchPageStyles);
  const currentUser = useCurrentUser();
  const captureSearch = useSearchAnalytics();
  const captureResultSelected = useCaptureSearchResultSelected();
  const hintId = useId();
  const filtersId = useId();
  const timeframeId = useId();
  const timeframeRef = useRef<HTMLElement>(null);
  // Match down('sm'): mobile filters and results share a single scroll flow.
  const isDesktop = useIsAboveBreakpoint('md');
  const timeframeSlot = isDesktop ? providedTimeframeSlot : null;
  const filterTabSlot = isDesktop ? providedFilterTabSlot : null;
  const layoutRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const {state, setState} = useSearchPageState(presentation);
  const {expandedFilters, mobileFiltersOpen: filtersOpen} = state;
  const timeframeOpen = filtersOpen && expandedFilters.includes('time');
  useEffect(() => {
    if (timeframeOpen && presentation === 'page') timeframeRef.current?.scrollIntoView?.({block: 'start'});
  }, [timeframeOpen, presentation]);
  const [inputFocused, setInputFocused] = useState(false);
  const [nowMs] = useState(() => Date.now());
  // The indexed archive includes material from 2003, before the configured site origin.
  const scale = {originMs: Date.UTC(2003, 0, 1), nowMs};
  const {recallSearch, recordSearch, resetNavigation, clearHistory, retryHistory, hasHistory, error: historyError, readError: historyReadError} = useSearchHistory(currentUser?._id, true);

  const sortParam = formatSearchSort(state.sort);
  const request = {
    indexName: indexNameForKinds(state.kinds),
    query: state.query,
    sort: sortParam,
    filters: searchFiltersToParams(state.filters),
  };
  const {hits, loading, error, hasMore, total, loadMore} = useSearchResults(request, true);
  const handleResultKeyDown = useSearchPageNavigation({
    inputRef, resultsRef, searchKey: JSON.stringify(request), loadMore,
  });

  useEffect(() => {
    const target = sentinel.current;
    if (!target || loading || error || !hasMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void loadMore();
    }, {root: presentation === 'modal' ? (isDesktop ? layoutRef.current : scrollRef.current) : null, rootMargin: "0px 0px 400px 0px"});
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, error, hasMore, loadMore, presentation, isDesktop]);

  useEffect(() => {
    if (state.query) {
      captureSearch("searchPage", {...searchPageStateToQuery(state), query: state.query});
    }
  }, [state, captureSearch]);

  const setFilters = (patch: Partial<SearchFilterState>) => {
    setState(previous => ({...previous, filters: {...previous.filters, ...patch}}));
  };

  const removeAuthor = (userId: string) => {
    setFilters({authorIds: state.filters.authorIds.filter(id => id !== userId)});
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (currentUser && event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey
      && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const query = recallSearch(event.currentTarget.value, event.key);
      setState(previous => ({...previous, query}));
    }
  };

  const selectHit = (type: SearchIndexCollectionName, hit: SearchBarHit, position: number) => {
    captureResultSelected({
      query: state.query,
      resultId: hit._id,
      resultType: type,
      position,
      indexName: getSearchIndexName(type),
      context: "searchPage",
    });
    recordSearch(state.query);
  };

  if (!isSearchEnabled()) {
    return <div className={classes.root}>
      Search is disabled (ElasticSearch not configured on server)
    </div>;
  }

  const toggleFilter = (key: string) => setState(previous => ({
    ...previous,
    expandedFilters: previous.expandedFilters.includes(key)
      ? previous.expandedFilters.filter(item => item !== key)
      : [...previous.expandedFilters, key],
  }));
  const closeTimeframe = () => {
    toggleFilter('time');
    scrollRef.current?.querySelector<HTMLButtonElement>(`button[aria-controls="${timeframeId}"]`)?.focus({preventScroll: true});
  };
  const clearFilters = () => setState(previous => ({...previous, kinds: [], filters: {...defaultSearchPageState.filters}}));
  const {hasDateFilter, hasFilters} = summarizeSearchFilters(state);
  const showHistoryHint = !!currentUser && inputFocused && !state.query;
  const timeframePanel = (timeframeOpen || !!timeframeSlot) && <section
    ref={timeframeRef} data-search-timeframe-open={timeframeOpen} id={timeframeId} aria-label="Timeframe"
    className={classNames(classes.timeframePanel, {[classes.timeframePanelModal]: !!timeframeSlot, [classes.timeframePanelCollapsed]: !timeframeOpen})}
    inert={!timeframeOpen} aria-hidden={!timeframeOpen}
  >
    <SearchTimeframeBar value={state.filters.dateRange} onChange={(dateRange) => setFilters({dateRange})} scale={scale}>
      <button type="button" className={classes.clearFilters} aria-label="Done with timeframe" onClick={closeTimeframe}>Done</button>
    </SearchTimeframeBar>
  </section>;

  const filterTab = (
    <button type="button" className={classNames(classes.filterTab, {[classes.filterTabModal]: !!filterTabSlot})} aria-label="Filter results"
      aria-expanded={filtersOpen} aria-controls={`${filtersId} ${timeframeId}`}
      onClick={() => setState(previous => ({
        ...previous,
        mobileFiltersOpen: !previous.mobileFiltersOpen,
        expandedFilters: previous.mobileFiltersOpen ? previous.expandedFilters : [...defaultSearchPageState.expandedFilters],
      }))}>
      <ChevronDoubleRightIcon aria-hidden="true" className={classNames(classes.filterTabIcon, {[classes.filterTabIconOpen]: filtersOpen})} />
      <span className={classes.filterTabLabel}>filter results</span>
    </button>
  );

  return <div key={pathname} ref={scrollRef} data-search-filters-open={filtersOpen} className={classNames(classes.root, {[classes.modal]: presentation === 'modal', [classes.filtersClosed]: !filtersOpen})}>
    {/* Snippet widgets in the hit components need this context. Its static empty query does not search Elasticsearch. */}
    <InstantSearch indexName={getSearchIndexName("Posts")} searchClient={getSearchClient({emptyStringSearchResults: "empty"})}>
      {filterTabSlot && createPortal(filterTab, filterTabSlot)}
      {isDesktop && timeframePanel && (timeframeSlot ? createPortal(timeframePanel, timeframeSlot) : timeframePanel)}
      <div ref={layoutRef} className={classes.layout}>
        <SearchPageFilters state={state} setFilters={setFilters} toggleFilter={toggleFilter} clearFilters={clearFilters}
          filtersId={filtersId} timeframeId={timeframeId} isDesktop={isDesktop} timeframePanel={timeframePanel}>
          {hasHistory && <button type="button" className={classes.clearFilters} onClick={() => { void clearHistory(); }}>Clear search history</button>}
        </SearchPageFilters>
        <div className={classes.results} onKeyDown={handleResultKeyDown}>
          <div className={classes.topBar}>
            <form className={classes.searchBoxRow} role="search" onSubmit={(event) => {
              event.preventDefault();
              recordSearch(inputRef.current?.value ?? state.query);
              inputRef.current?.blur();
            }}>
              {isDesktop && !filterTabSlot && filterTab}
              <div className={classes.searchInputArea}>
                <ForumIcon icon="Search" className={classes.searchIcon} />
                <SearchQueryInput
                  ref={inputRef}
                  type="search"
                  data-search-input
                  className={classes.input}
                  aria-label="Search"
                  placeholder="Search"
                  autoComplete="off"
                  autoFocus={presentation === 'page'}
                  value={state.query}
                  aria-describedby={showHistoryHint ? hintId : undefined}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={handleKeyDown}
                  onChange={(query) => {
                    resetNavigation();
                    setState(previous => ({...previous, query}));
                  }}
                />
                {!!state.filters.authorIds.length && <div className={classes.authorPills} role="group" aria-label="Selected authors">
                  {state.filters.authorIds.map(userId => <SingleUsersItem variant="search" key={userId} userId={userId} removeItem={removeAuthor} />)}
                </div>}
              </div>
              {onClose && <button type="button" className={classes.closeButton} aria-label="Close search" onClick={onClose}>✕</button>}
            </form>
            {showHistoryHint && <div id={hintId} className={classes.historyHint}>Shift+↑ / Shift+↓: search history</div>}

            {historyReadError && <div role="status">
              Could not load search history. <button type="button" onClick={() => { void retryHistory(); }}>Retry history</button>
            </div>}
            {historyError && <div role="status">Could not update search history.</div>}
            <SearchKindBar
              className={classes.kinds}
              enabled={state.kinds}
              onSelect={presentation === "modal" ? type => setState(previous => ({...previous, kinds: [type]})) : undefined}
              onAdd={presentation === "modal" ? type => setState(previous => ({
                ...previous,
                kinds: previous.kinds.includes(type) ? previous.kinds : [...previous.kinds, type],
              })) : undefined}
              onClear={() => setState(previous => ({...previous, kinds: []}))}
              onToggle={(type) => setState(previous => ({...previous, kinds: toggleSearchKind(previous.kinds, type)}))}
            />
            {!isDesktop && filterTab}
          </div>
          <SearchPageResults presentation={presentation} hits={hits} total={total} loading={loading} error={error}
            loadMore={loadMore} resultsRef={resultsRef} sentinel={sentinel} selectHit={selectHit}
            hasDateFilter={hasDateFilter} hasFilters={hasFilters} clearDateFilter={() => setFilters({dateRange: {}})} clearFilters={clearFilters} />
        </div>
      </div>
    </InstantSearch>
  </div>;
};

export default SearchPage;
