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
import { defaultSearchFilters, searchFiltersToParams, SearchFilterState } from '@/lib/search/searchFilters';
import { useSearchPageState } from './useSearchPageState';
import { searchPageStyles } from './searchPageStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';
import SearchPageResults from './SearchPageResults';
import SearchQueryInput from './SearchQueryInput';
import ForumIcon from '../common/ForumIcon';
import { useSearchAnalytics, useCaptureSearchResultSelected } from './useSearchAnalytics';
import { useSearchPageNavigation } from './useSearchPageNavigation';
import { SearchBarHit, useSearchResults } from './useSearchResults';
import { searchPageStateToQuery } from './searchPageUrl';
import SearchKindBar, { searchKinds, toggleSearchKind } from './SearchKindBar';
import SearchPageFilters, { SearchFilterPanel, searchFilterPanels, summarizeSearchFilters } from './SearchPageFilters';
import SingleUsersItem from '../form-components/SingleUsersItem';

/** How long typing has to pause before the query is searched */
const queryDebounceMs = 150;

function indexNameForKinds(kinds: SearchIndexCollectionName[]): string {
  return searchKinds
    .filter(({type}) => !kinds.length || kinds.includes(type))
    .map(({type}) => getSearchIndexName(type))
    .join(",");
}

interface SearchPageProps {
  presentation?: 'page' | 'modal',
  onClose?: () => void,
  filterTabSlot?: HTMLElement | null,
}

const SearchPage = ({presentation = 'page', onClose, filterTabSlot: providedFilterTabSlot}: SearchPageProps) => {
  // HACK: workaround for cacheComponents' background use of <Activity> breaking search in a lot of situations after navigation.
  const pathname = usePathname();
  const classes = useStyles(searchPageStyles);
  const captureSearch = useSearchAnalytics();
  const captureResultSelected = useCaptureSearchResultSelected();
  const filtersId = useId();
  const isDesktop = useIsAboveBreakpoint('md');
  const filterTabSlot = isDesktop ? providedFilterTabSlot : null;
  const layoutRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const {state, setState} = useSearchPageState(presentation);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<SearchFilterPanel[]>([...searchFilterPanels]);
  const [debouncedQuery, setDebouncedQuery] = useState(state.query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(state.query), queryDebounceMs);
    return () => clearTimeout(timer);
  }, [state.query]);

  const request = {
    indexName: indexNameForKinds(state.kinds),
    query: debouncedQuery,
    filters: searchFiltersToParams(state.filters),
  };
  const {hits, loading, error, hasMore, total, loadMore} = useSearchResults(request);
  const searchKey = JSON.stringify(request);
  const analyticsContext = presentation === 'modal' ? "searchBar" : "searchPage";
  const resultNavigation = useSearchPageNavigation({
    inputRef, resultsRef, searchKey, loadMore, query: debouncedQuery, enterOpensResult: presentation === 'modal',
  });

  useEffect(() => {
    const target = sentinel.current;
    if (!target || loading || error || !hasMore) return;
    const modalScroller = isDesktop ? layoutRef.current : scrollRef.current;
    const root = presentation === 'modal' ? modalScroller : null;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void loadMore();
    }, {root, rootMargin: "0px 0px 400px 0px"});
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, error, hasMore, loadMore, presentation, isDesktop]);

  useEffect(() => {
    if (state.query) {
      captureSearch(analyticsContext, {...searchPageStateToQuery(state), query: state.query});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  const setFilters = (patch: Partial<SearchFilterState>) => {
    setState(previous => ({...previous, filters: {...previous.filters, ...patch}}));
  };

  const removeAuthor = (userId: string) => {
    setFilters({authorIds: state.filters.authorIds.filter(id => id !== userId)});
    inputRef.current?.focus();
  };

  const selectHit = (type: SearchIndexCollectionName, hit: SearchBarHit, position: number) => {
    captureResultSelected({
      query: state.query,
      resultId: hit._id,
      resultType: type,
      position,
      indexName: getSearchIndexName(type),
      context: analyticsContext,
    });
  };

  if (!isSearchEnabled()) {
    return <div className={classes.root}>
      Search is disabled (ElasticSearch not configured on server)
    </div>;
  }

  const toggleFilter = (key: SearchFilterPanel) => setExpandedFilters(previous => previous.includes(key)
    ? previous.filter(item => item !== key)
    : [...previous, key]);
  const toggleFiltersOpen = () => {
    if (!filtersOpen) setExpandedFilters([...searchFilterPanels]);
    setFiltersOpen(!filtersOpen);
  };
  const clearFilters = () => setState(previous => ({...previous, kinds: [], filters: defaultSearchFilters}));
  const {hasDateFilter, hasFilters} = summarizeSearchFilters(state);
  const filterTab = (
    <button type="button" className={classNames(classes.filterTab, {[classes.filterTabModal]: !!filterTabSlot})} aria-label="Filter results"
      aria-expanded={filtersOpen} aria-controls={filtersId}
      onClick={toggleFiltersOpen}>
      <ChevronDoubleRightIcon aria-hidden="true" className={classNames(classes.filterTabIcon, {[classes.filterTabIconOpen]: filtersOpen})} />
      <span className={classes.filterTabLabel}>filter results</span>
    </button>
  );

  return <div key={pathname} ref={scrollRef} data-search-filters-open={filtersOpen} className={classNames(classes.root, {[classes.modal]: presentation === 'modal', [classes.filtersClosed]: !filtersOpen})}>
    <InstantSearch indexName={getSearchIndexName("Posts")} searchClient={getSearchClient({emptyStringSearchResults: "empty", mode: "unified"})}>
      {filterTabSlot && createPortal(filterTab, filterTabSlot)}
      <div ref={layoutRef} className={classes.layout}>
        <SearchPageFilters state={state} expandedFilters={expandedFilters} filtersOpen={filtersOpen} setFilters={setFilters} toggleFilter={toggleFilter} clearFilters={clearFilters}
          filtersId={filtersId} />
        <div className={classes.results} {...resultNavigation}>
          <div className={classes.topBar}>
            <form className={classes.searchBoxRow} role="search" onSubmit={(event) => {
              event.preventDefault();
              // Dismiss the on-screen keyboard; with a real keyboard, blurring would strand focus outside the input
              if (window.matchMedia('(pointer: coarse)').matches) inputRef.current?.blur();
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
                  onChange={(query) => setState(previous => ({...previous, query}))}
                />
                {!!state.filters.authorIds.length && <div className={classes.authorPills} role="group" aria-label="Selected authors">
                  {state.filters.authorIds.map(userId => <SingleUsersItem variant="search" key={userId} userId={userId} removeItem={removeAuthor} />)}
                </div>}
              </div>
              {onClose && <button type="button" className={classes.closeButton} aria-label="Close search" onClick={onClose}>✕</button>}
            </form>
            <SearchKindBar
              className={classes.kinds}
              enabled={state.kinds}
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
