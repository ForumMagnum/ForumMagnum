"use client";
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import qs from 'qs';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { InstantSearch } from '@/lib/utils/componentsWithChildren';
import {
  SearchIndexCollectionName,
  getSearchClient,
  getSearchIndexName,
  isSearchEnabled,
} from '@/lib/search/searchUtil';
import { formatSearchSort } from '@/lib/search/searchSorting';
import { searchFiltersToParams, SearchFilterState, emptySearchFilters, defaultSearchPostTypes, searchPostTypeLabels } from '@/lib/search/searchFilters';
import { useNavigate, useSubscribedLocation } from '@/lib/routeUtil';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';
import { useCurrentUser } from '../common/withUser';
import ErrorBoundary from '../common/ErrorBoundary';
import ForumIcon from '../common/ForumIcon';
import { useSearchAnalytics, useCaptureSearchResultSelected } from './useSearchAnalytics';
import { useSearchHistory } from './useSearchHistory';
import { useSearchPageNavigation } from './useSearchPageNavigation';
import { SearchBarHit, useSearchResults } from './useSearchResults';
import { SearchPageState, searchPageStateFromQuery, searchPageStateToQuery } from './searchPageUrl';
import SearchKindBar, { searchKinds, toggleSearchKind } from './SearchKindBar';
import SearchWikitagsBar from './SearchWikitagsBar';
import SearchTimeframeBar from './SearchTimeframeBar';
import SearchEventsBar from './SearchEventsBar';
import SearchPostTypeBar from './SearchPostTypeBar';
import SearchAuthorsBar from './SearchAuthorsBar';
import SingleUsersItem from '../form-components/SingleUsersItem';
import SearchKarmaBar from './SearchKarmaBar';
import SearchFilterRow from './SearchFilterRow';
import { getBrowserLocalStorage, safeStorageGetItem, safeStorageSetItem } from '../editor/localStorageHandlers';
import ExpandedUsersSearchHit from './ExpandedUsersSearchHit';
import ExpandedPostsSearchHit from './ExpandedPostsSearchHit';
import ExpandedCommentsSearchHit from './ExpandedCommentsSearchHit';
import ExpandedTagsSearchHit from './ExpandedTagsSearchHit';
import ExpandedSequencesSearchHit from './ExpandedSequencesSearchHit';

const hitComponents: Record<SearchIndexCollectionName, React.ComponentType<{hit: SearchBarHit, icon?: React.ReactNode}>> = {
  Users: ExpandedUsersSearchHit,
  Posts: ExpandedPostsSearchHit,
  Comments: ExpandedCommentsSearchHit,
  Tags: ExpandedTagsSearchHit,
  Sequences: ExpandedSequencesSearchHit,
};

const styles = defineStyles("SearchPageResults", (theme: ThemeType) => ({
  root: {
    width: "100%",
    margin: "auto",
    marginTop: -theme.spacing.mainLayoutPaddingTop,
    padding: "0 24px 64px",
    boxSizing: "border-box",
    [theme.breakpoints.down('sm')]: {
      marginTop: -10,
      padding: "0 8px 40px",
    },
  },
  modal: {
    '--header-height': '0px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    margin: 0,
    padding: '0 24px 24px',
    // Inset the scrollbar without moving the search controls or results.
    '&::-webkit-scrollbar, & $layout::-webkit-scrollbar': {
      width: 12,
    },
    '&::-webkit-scrollbar-track, & $layout::-webkit-scrollbar-track': {
      marginTop: 64,
    },
    '&::-webkit-scrollbar-thumb, & $layout::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.greyAlpha(0.45),
      borderRadius: 6,
      border: '2px solid transparent',
      backgroundClip: 'padding-box',
    },
    '& $sidebar': {maxHeight: 'calc(var(--search-viewport-height, 100dvh) - 56px)'},
    '& $layout': {
      flex: 1,
      minHeight: 200,
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      gridTemplateColumns: '340px minmax(0, 1fr)',
      gridTemplateAreas: '"sidebar results"',
    },
    [theme.breakpoints.down('sm')]: {
      height: '100%',
      maxHeight: '100%',
      margin: 0,
      padding: '0 max(8px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))',
      '& $layout': {
        height: 'auto',
        flex: '0 0 auto',
        minHeight: 0,
        overflow: 'visible',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateAreas: '"controls" "sidebar" "hits"',
      },
      '& $sidebar': {maxHeight: 'none'},
      '& $topBar': {padding: '8px 0 4px'},
      '& $searchBoxRow': {gap: 4, marginBottom: 4},
      '& $kinds': {margin: 0, padding: '8px 0'},
      '& $resultCount': {marginBottom: 8},
      '& $historyHint': {marginTop: 0, marginBottom: 4},
    },
  },
  timeframePanel: {
    flexShrink: 0,
    width: '100%',
    maxWidth: 1200,
    position: 'relative',
    margin: '8px auto 0',
    padding: '8px 12px 0px',
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    border: "none",
    borderRadius: 4,
    scrollMarginTop: 'calc(var(--header-height) + 8px)',
    [theme.breakpoints.down('sm')]: {padding: '4px 8px 8px', marginTop: 8},
  },
  // Rendered into the modal's slot above the dialog box. It stays mounted while
  // collapsed so the dialog box keeps the same place on screen.
  // It sits flush on the dialog box and paints above it. The clip drops the
  // shadow below its bottom edge so the two boxes read as one.
  timeframePanelModal: {
    flexShrink: 0,
    zIndex: 1,
    margin: 0,
    minHeight: 0,
    overflowY: 'auto',
    border: 'none',
    borderRadius: '6px 6px 0 0',
    boxShadow: `0 0 40px ${theme.palette.boxShadowColor(0.3)}`,
    clipPath: 'inset(-48px -48px 0)',
  },
  timeframePanelCollapsed: {
    visibility: 'hidden',
  },
  mobileFiltersToggle: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {display: 'inline-flex', alignItems: 'center'},
  },
  closeButton: {
    ...theme.typography.body2,
    border: 'none',
    background: 'transparent',
    color: theme.palette.text.normal,
    cursor: 'pointer',
    minWidth: 44,
    minHeight: 44,
    flexShrink: 0,
    '&:focus-visible': {outline: `2px solid ${theme.palette.primary.main}`},
  },
  topBar: {
    position: "sticky",
    top: "var(--header-height)",
    zIndex: 10,
    boxSizing: "border-box",
    padding: "16px 0 12px",
    [theme.breakpoints.down('sm')]: {
      gridArea: "controls",
      position: "static",
    },
    backgroundColor: theme.palette.background.paper,

  },
  layout: {
    display: "grid",
    // Keep the filter column wide enough for its controls; center results when space allows.
    gridTemplateColumns: "minmax(340px, 1fr) minmax(0, 760px) minmax(0, 1fr)",
    gridTemplateAreas: '"sidebar results ."',
    gap: 24,
    alignItems: "start",
    "@media (max-width: 1399px)": {
      gridTemplateColumns: "340px minmax(0, 760px)",
      gridTemplateAreas: '"sidebar results"',
      justifyContent: "center",
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: "minmax(0, 1fr)",
      gridTemplateAreas: '"controls" "sidebar" "hits"',
      gridAutoRows: "max-content",
      alignContent: "start",
      gap: 8,
    },
  },
  sidebar: {
    gridArea: "sidebar",
    position: "sticky",
    top: "calc(var(--header-height) + 16px)",
    marginTop: 16,
    width: "100%",
    maxWidth: 360,
    justifySelf: "end",
    boxSizing: "border-box",
    maxHeight: "calc(100dvh - var(--header-height) - 32px)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    scrollbarGutter: "stable",
    padding: "4px 0 8px",
    backgroundColor: theme.palette.background.paper,
    border: "none",
    borderRadius: 4,
    zIndex: 9,
    [theme.breakpoints.down('sm')]: {
      position: "static",
      maxWidth: "none",
      maxHeight: "none",
      overflow: "visible",
      scrollbarGutter: "auto",
      display: "none",
      marginTop: 0,
    },
  },
  mobileFiltersOpen: {
    [theme.breakpoints.down('sm')]: {display: 'block'},
  },
  results: {
    gridArea: "results",
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      display: "contents",
    },
  },
  resultsContent: {
    [theme.breakpoints.down('sm')]: {
      gridArea: "hits",
      minWidth: 0,
    },
  },
  searchBoxRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
    },
  },
  searchInputArea: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    alignItems: "center",
    minHeight: 44,
    flexWrap: "wrap",
    gap: "4px 10px",
    padding: "2px 14px",
    boxSizing: "border-box",
    border: theme.palette.greyBorder("1px", 0.08),
    borderRadius: 8,
    backgroundColor: theme.palette.greyAlpha(0.035),
    transition: "background-color 150ms, border-color 150ms, box-shadow 150ms",
    "&:hover": {borderColor: theme.palette.greyAlpha(0.18)},
    "&:focus-within": {
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}, 0 2px 8px ${theme.palette.boxShadowColor(0.06)}`,
      "& $searchIcon": {color: theme.palette.primary.main},
    },
  },
  searchIcon: {
    fontSize: 20,
    flexShrink: 0,
    color: theme.palette.text.dim,
  },
  input: {
    minWidth: 0,
    ...theme.typography.body2,
    flex: "1 1 120px",
    height: 38,
    padding: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: theme.palette.text.normal,
    fontSize: 16,
    "&::placeholder": {color: theme.palette.text.dim, opacity: 1},
    "&::-webkit-search-cancel-button": {
      WebkitAppearance: "none",
      width: 16,
      height: 16,
      cursor: "pointer",
      backgroundColor: theme.palette.text.dim,
      mask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M4 4l8 8M12 4l-8 8\' stroke=\'black\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E") center / contain no-repeat',
    },
    "-webkit-appearance": "none",
  },
  authorPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
    minWidth: 0,
    '& .users-item': {minWidth: 0, maxWidth: '100%'},
    '& .SingleUsersItem-chip': {
      margin: 0,
      minHeight: 32,
      borderRadius: 4,
      '@media (pointer: coarse)': {minHeight: 40},
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
    },
  },
  clearFilters: {
    ...theme.typography.body2,
    minHeight: 40, border: "none", background: "transparent",
    color: theme.palette.primary.main, cursor: "pointer", padding: "0 8px",
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`},
  },
  clearFiltersButton: {
    fontWeight: 600,
    backgroundColor: theme.palette.greyAlpha(0.08),
    borderRadius: 4,
    padding: "0 12px",
    "&:hover": {backgroundColor: theme.palette.greyAlpha(0.14)},
  },
  filters: {
    marginTop: 0,
    marginBottom: 0,
  },
  kinds: {
    marginTop: 4,
    marginBottom: 4,
    justifyContent: "flex-start",
    gap: 4,
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      padding: "16px 0",
      gap: 0,
    },
  },
  postTypes: {flexWrap: "wrap"},
  resultCount: {
    ...theme.typography.body2,
    fontSize: 14,
    color: theme.palette.text.normal,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: "4px 16px",
    padding: "8px 20px 12px",
    marginBottom: 4,
    fontVariantNumeric: "tabular-nums",
  },
  result: {
    position: "relative",
    display: "flex",
    padding: "8px 20px",
    borderRadius: 5,
    [theme.breakpoints.down('sm')]: {padding: '8px'},
    scrollMarginTop: 'calc(var(--header-height) + 160px)',
    scrollMarginBottom: 16,
    "&:hover, &:focus-within, &[data-search-selected]": {
      backgroundColor: theme.palette.greyAlpha(0.05),
    },
    "& a:hover": {opacity: 1},
  },
  resultIcon: {
    display: "flex",
    position: "absolute",
    top: "50%",
    left: 20,
    [theme.breakpoints.down('sm')]: {left: 8},
    transform: "translateY(-50%)",
    fontSize: 20,
    color: theme.palette.text.dim,
    "& > svg": {fontSize: "inherit"},
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 38,
    // Anchor the result link and copy button to the entire padded row.
    "& > div": {marginBottom: 0, position: "static"},
  },
  status: {
    ...theme.typography.body2,
    padding: 12,
    textAlign: "center",
  },
  historyHint: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.text.dim,
    marginTop: -12,
    marginBottom: 12,
  },
}));

function indexNameForKinds(kinds: SearchIndexCollectionName[]): string {
  return searchKinds
    .filter(({type}) => !kinds.length || kinds.includes(type))
    .map(({type}) => getSearchIndexName(type))
    .join(",");
}

const lastModalSearchKey = 'search.lastModalState';

interface SearchPageProps {
  presentation?: 'page' | 'modal',
  onClose?: () => void,
  /** Where the modal shows the timeline on wide screens: above its dialog box instead of inside the search layout. */
  timeframeSlot?: HTMLElement | null,
}

const SearchPage = ({presentation = 'page', onClose, timeframeSlot: providedTimeframeSlot}: SearchPageProps) => {
  // HACK: workaround for cacheComponents' background use of <Activity> breaking search in a lot of situations after navigation.
  const pathname = usePathname();
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const {location, query: urlQuery} = useSubscribedLocation();
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
  const layoutRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const writtenSearch = useRef<string | null>(null);
  const observedSearch = useRef(location.search);
  const [expandedFilters, setExpandedFilters] = useState<string[]>(['authors']);
  const timeframeOpen = expandedFilters.includes('time');
  useEffect(() => {
    if (timeframeOpen && presentation === 'page') timeframeRef.current?.scrollIntoView?.({block: 'start'});
  }, [timeframeOpen, presentation]);
  const [state, setState] = useState<SearchPageState>(() => {
    if (presentation === 'modal') {
      const saved = safeStorageGetItem(getBrowserLocalStorage(), lastModalSearchKey);
      if (saved !== null) return searchPageStateFromQuery(Object.fromEntries(new URLSearchParams(saved)));
    }
    return searchPageStateFromQuery(presentation === 'page' || pathname === '/search' ? urlQuery : {});
  });
  useEffect(() => {
    if (presentation === 'modal') {
      safeStorageSetItem(getBrowserLocalStorage(), lastModalSearchKey, qs.stringify(searchPageStateToQuery(state)));
    }
  }, [state, presentation]);
  const [inputFocused, setInputFocused] = useState(false);
  const [nowMs] = useState(() => Date.now());
  // The indexed archive includes material from 2003, before the configured site origin.
  const scale = {originMs: Date.UTC(2003, 0, 1), nowMs};
  const {recallSearch, recordSearch, resetNavigation, clearHistory, hasHistory, error: historyError} = useSearchHistory(currentUser?._id, true);

  // External navigation wins before writing local refinements back to the URL.
  useEffect(() => {
    if (presentation === 'modal') return;
    if (location.search !== observedSearch.current) {
      observedSearch.current = location.search;
      if (location.search !== writtenSearch.current) {
        setState(searchPageStateFromQuery(urlQuery));
        return;
      }
    }
    const search = qs.stringify(searchPageStateToQuery(state));
    const targetSearch = search ? `?${search}` : "";
    writtenSearch.current = targetSearch;
    if (location.search !== targetSearch) navigate({...location, search}, {replace: true, skipRouter: true});
  // URL query and location are snapshots of location.search; other URL parts are read at write time.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, navigate, location.search, presentation]);

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
      const query = recallSearch(state.query, event.key);
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

  const toggleFilter = (key: string) => setExpandedFilters(previous => previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]);
  const closeTimeframe = () => {
    toggleFilter('time');
    scrollRef.current?.querySelector<HTMLButtonElement>(`button[aria-controls="${timeframeId}"]`)?.focus({preventScroll: true});
  };
  const clearFilters = () => setState(previous => ({...previous, kinds: [], filters: {...emptySearchFilters, postTypes: defaultSearchPostTypes}}));
  const {dateRange, karmaRange} = state.filters;
  const hasDateFilter = dateRange.start !== undefined || dateRange.end !== undefined;
  const hasKarmaFilter = karmaRange.min !== undefined || karmaRange.max !== undefined;
  const hasPostFilter = state.filters.postTypes.length > 0 && state.filters.postTypes.length !== defaultSearchPostTypes.length;
  const hasFilters = hasDateFilter || hasKarmaFilter || hasPostFilter || state.filters.events !== "include" || !!state.filters.tagIds.length || !!state.filters.authorIds.length || !!state.kinds.length;
  const dateSummary = hasDateFilter ? `${dateRange.start === undefined ? "Beginning" : new Date(dateRange.start).toISOString().slice(0, 10)} – ${dateRange.end === undefined ? "Today" : new Date(dateRange.end).toISOString().slice(0, 10)}` : "All time";
  const showHistoryHint = !!currentUser && inputFocused && !state.query;
  const timeframePanel = (timeframeOpen || !!timeframeSlot) && <section
    ref={timeframeRef} id={timeframeId} aria-label="Timeframe"
    className={classNames(classes.timeframePanel, {[classes.timeframePanelModal]: !!timeframeSlot, [classes.timeframePanelCollapsed]: !timeframeOpen})}
    inert={!timeframeOpen} aria-hidden={!timeframeOpen}
  >
    <SearchTimeframeBar value={state.filters.dateRange} onChange={(dateRange) => setFilters({dateRange})} scale={scale}>
      <button type="button" className={classes.clearFilters} aria-label="Done with timeframe" onClick={closeTimeframe}>Done</button>
    </SearchTimeframeBar>
  </section>;

  return <div key={pathname} ref={scrollRef} className={classNames(classes.root, {[classes.modal]: presentation === 'modal'})}>
    {/* Snippet widgets in the hit components need this context. Its static empty query does not search Elasticsearch. */}
    <InstantSearch indexName={getSearchIndexName("Posts")} searchClient={getSearchClient({emptyStringSearchResults: "empty"})}>
      {isDesktop && timeframePanel && (timeframeSlot ? createPortal(timeframePanel, timeframeSlot) : timeframePanel)}
      <div ref={layoutRef} className={classes.layout}>
        <aside id={filtersId} className={classNames(classes.sidebar, {[classes.mobileFiltersOpen]: mobileFiltersOpen})} aria-label="Search options">
          <SearchFilterRow label="Timeframe" expandDirection={isDesktop ? "up" : "down"} summary={dateSummary} active={hasDateFilter} expanded={timeframeOpen}
            controlsId={timeframeId} onToggle={() => toggleFilter('time')} onReset={() => setFilters({dateRange: {}})} />
          {!isDesktop && timeframePanel}
          <SearchFilterRow label="Author" summary={state.filters.authorIds.length ? `${state.filters.authorIds.length} selected` : "Anyone"} active={!!state.filters.authorIds.length} expanded={expandedFilters.includes("authors")} onToggle={() => toggleFilter("authors")} onReset={() => setFilters({authorIds: []})}>
            <SearchAuthorsBar authorIds={state.filters.authorIds} onChange={(authorIds) => setFilters({authorIds})} />
          </SearchFilterRow>

          <div className={classes.filters}>
            <SearchFilterRow label="Wikitags" summary={state.filters.tagIds.length ? `${state.filters.tagIds.length} selected · match ${state.filters.tagMatch}` : "Any wikitag"} active={!!state.filters.tagIds.length} expanded={expandedFilters.includes("tags")} onToggle={() => toggleFilter("tags")} onReset={() => setFilters({tagIds: [], tagMatch: "any"})}>
              <SearchWikitagsBar match={state.filters.tagMatch} onMatchChange={(tagMatch) => setFilters({tagMatch})} tagIds={state.filters.tagIds} onChange={(tagIds) => setFilters({tagIds})} />
            </SearchFilterRow>
            <SearchFilterRow label="Events" summary={state.filters.events === "include" ? "Included" : state.filters.events === "exclude" ? "Excluded" : "Only events"} active={state.filters.events !== "include"} expanded={expandedFilters.includes("events")} onToggle={() => toggleFilter("events")} onReset={() => setFilters({events: "include"})}>
              <SearchEventsBar value={state.filters.events} onChange={(events) => setFilters({events})} />
            </SearchFilterRow>
            <SearchFilterRow label="Post types" summary={hasPostFilter ? state.filters.postTypes.map(type => searchPostTypeLabels[type]).join(", ") : "All post types"} active={hasPostFilter} expanded={expandedFilters.includes("types")} onToggle={() => toggleFilter("types")} onReset={() => setFilters({postTypes: defaultSearchPostTypes})}>
              <SearchPostTypeBar className={classes.postTypes} selected={state.filters.postTypes} onChange={(postTypes) => setFilters({postTypes})} />
            </SearchFilterRow>
            <SearchFilterRow label="Karma" summary={hasKarmaFilter ? `${state.filters.karmaRange.min ?? "Any"} to ${state.filters.karmaRange.max ?? "any"}` : "Any karma"} active={hasKarmaFilter} expanded={expandedFilters.includes("karma")} onToggle={() => toggleFilter("karma")} onReset={() => setFilters({karmaRange: {}})}>
              <SearchKarmaBar value={state.filters.karmaRange} onChange={(karmaRange) => setFilters({karmaRange})} />
            </SearchFilterRow>
            {hasFilters && <button type="button" className={classNames(classes.clearFilters, classes.clearFiltersButton)} onClick={clearFilters}>Clear filters</button>}
          </div>
          {hasHistory && <button type="button" className={classes.clearFilters} onClick={() => { void clearHistory(); }}>Clear search history</button>}
          {historyError && <div role="status">Could not update search history.</div>}
        </aside>
        <div className={classes.results} onKeyDown={handleResultKeyDown}>
          <div className={classes.topBar}>
            <form className={classes.searchBoxRow} role="search" onSubmit={(event) => {
              event.preventDefault();
              recordSearch(state.query);
              inputRef.current?.blur();
            }}>
              <div className={classes.searchInputArea}>
                <ForumIcon icon="Search" className={classes.searchIcon} />
                <input
                  ref={inputRef}
                  type="search"
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
                  onChange={(event) => {
                    resetNavigation();
                    const query = event.target.value;
                    setState(previous => ({...previous, query}));
                  }}
                />
                {!!state.filters.authorIds.length && <div className={classes.authorPills} role="group" aria-label="Selected authors">
                  {state.filters.authorIds.map(userId => <SingleUsersItem key={userId} userId={userId} removeItem={removeAuthor} />)}
                </div>}
              </div>
              {onClose && <button type="button" className={classes.closeButton} aria-label="Close search" onClick={onClose}>✕</button>}
            </form>
            {showHistoryHint && <div id={hintId} className={classes.historyHint}>Shift+↑ / Shift+↓: search history</div>}

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
            <button type="button" className={classNames(classes.clearFilters, classes.mobileFiltersToggle)}
              aria-expanded={mobileFiltersOpen} aria-controls={filtersId}
              onClick={() => setMobileFiltersOpen(previous => !previous)}>
              {mobileFiltersOpen ? 'Hide filters' : 'Filters'}
            </button>
          </div>
          <div className={classes.resultsContent}>
            <ErrorBoundary>
              {total !== null && <div className={classes.resultCount} aria-live="polite">
                <span><strong>{total.toLocaleString()}</strong> result{total === 1 ? '' : 's'}</span>
              </div>}
              <div ref={resultsRef} role="group" aria-label="Search results" aria-busy={loading}>
                {hits.map((hit, position) => {
                  const kind = searchKinds.find(({type}) => type.toLowerCase() === hit._index);
                  if (!kind) return null;
                  const Component = hitComponents[kind.type];
                  return <ErrorBoundary key={`${hit._index}:${hit._id}`}>
                    <div className={classes.result} data-search-result onClickCapture={(event) => {
                      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                      if (event.target instanceof Element && event.target.closest('button')) return;
                      selectHit(kind.type, hit, position);
                    }}>
                      <div className={classes.resultBody}>
                        <Component hit={hit} icon={
                          <span className={classes.resultIcon} role="img" aria-label={kind.label}><kind.Icon /></span>
                        } />
                      </div>
                    </div>
                  </ErrorBoundary>;
                })}
              </div>
              <div ref={sentinel} />
              {loading && <div className={classes.status} role="status">Loading results…</div>}
              {error && <div className={classes.status} role="status">
                Could not load results. <button type="button" onClick={() => { void loadMore(); }}>Try again</button>
              </div>}
              {!loading && !error && total !== null && !hits.length && <div className={classes.status}>
                <div>No results found. Try a broader query or remove a filter.</div>
                {hasDateFilter && <button type="button" className={classes.clearFilters} onClick={() => setFilters({dateRange: {}})}>Remove timeframe</button>}
                {hasFilters && <button type="button" className={classNames(classes.clearFilters, classes.clearFiltersButton)} onClick={clearFilters}>Clear filters</button>}
              </div>}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </InstantSearch>
  </div>;
};

export default SearchPage;
