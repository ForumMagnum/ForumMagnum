"use client";
import React, { useEffect, useId, useRef, useState } from 'react';
import qs from 'qs';
import { usePathname } from 'next/navigation';
import { InstantSearch } from '@/lib/utils/componentsWithChildren';
import { searchOriginDate } from '@/lib/instanceSettings';
import {
  SearchIndexCollectionName,
  getSearchClient,
  getSearchIndexName,
  isSearchEnabled,
} from '@/lib/search/searchUtil';
import { defaultSearchSort, searchSortLabels, searchSortToUrlParam, formatSearchSort } from '@/lib/search/searchSorting';
import { searchFiltersToParams, SearchFilterState, emptySearchFilters, defaultSearchPostTypes, searchPostTypeLabels } from '@/lib/search/searchFilters';
import { useNavigate, useSubscribedLocation } from '@/lib/routeUtil';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import ErrorBoundary from '../common/ErrorBoundary';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';
import InfoIcon from '@/lib/vendor/@material-ui/icons/src/Info';
import { useSearchAnalytics, useCaptureSearchResultSelected } from './useSearchAnalytics';
import { useSearchHistory } from './useSearchHistory';
import { useSearchPageNavigation } from './useSearchPageNavigation';
import { SearchBarHit, useSearchResults } from './useSearchResults';
import { SearchPageState, searchPageStateFromQuery, searchPageStateToQuery } from './searchPageUrl';
import SearchKindBar, { searchKinds, toggleSearchKind } from './SearchKindBar';
import SearchSorterBar from './SearchSorterBar';
import SearchWikitagsBar from './SearchWikitagsBar';
import SearchTimeframeBar from './SearchTimeframeBar';
import SearchEventsBar from './SearchEventsBar';
import SearchPostTypeBar from './SearchPostTypeBar';
import SearchAuthorsBar from './SearchAuthorsBar';
import SearchKarmaBar from './SearchKarmaBar';
import SearchFilterRow from './SearchFilterRow';
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

const styles = defineStyles("SearchPage", (theme: ThemeType) => ({
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
  topBar: {
    position: "sticky",
    top: "var(--header-height)",
    zIndex: 10,
    boxSizing: "border-box",
    padding: "16px 0 12px",
    [theme.breakpoints.down('sm')]: {
      gridArea: "controls",
    },
    backgroundColor: theme.palette.background.paper,
    "&::before": {
      content: '""',
      position: "absolute",
      bottom: "100%",
      left: 0,
      right: 0,
      height: "var(--header-height)",
      backgroundColor: theme.palette.background.paper,
    },
  },
  layout: {
    display: "grid",
    // Equal outer tracks keep the search column centered in the viewport.
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 760px) minmax(0, 1fr)",
    gridTemplateAreas: '"sidebar results ."',
    gap: 24,
    alignItems: "start",
    "@media (max-width: 1399px)": {
      gridTemplateColumns: "280px minmax(0, 760px)",
      gridTemplateAreas: '"sidebar results"',
      justifyContent: "center",
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: "minmax(0, 1fr)",
      gridTemplateAreas: '"controls" "sidebar" "hits"',
      gap: 32,
    },
  },
  sidebar: {
    gridArea: "sidebar",
    position: "sticky",
    top: "calc(var(--header-height) + 16px)",
    marginTop: 16,
    width: "100%",
    maxWidth: 320,
    justifySelf: "end",
    boxSizing: "border-box",
    maxHeight: "calc(100dvh - var(--header-height) - 32px)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    scrollbarGutter: "stable",
    padding: "16px 24px 24px",
    backgroundColor: theme.palette.background.paper,
    border: theme.palette.greyBorder("1px", 0.08),
    borderRadius: 4,
    zIndex: 9,
    [theme.breakpoints.down('sm')]: {
      position: "static",
      maxWidth: "none",
      maxHeight: "35dvh",
      marginTop: 0,
    },
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
    gap: 16,
    marginBottom: 16,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
    },
  },
  searchInputArea: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    alignItems: "center",
    height: 48,
    border: theme.palette.border.slightlyIntense2,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.default,
  },
  searchIcon: {
    marginLeft: 12,
  },
  input: {
    minWidth: 0,
    ...theme.typography.body2,
    flex: 1,
    height: "100%",
    marginLeft: 12,
    border: "none",
    outline: "none",
    background: "transparent",
    color: theme.palette.text.normal,
    fontSize: 16,
    "-webkit-appearance": "none",
  },
  infoIcon: {
    fontSize: 20,
    fill: theme.palette.grey[800],
  },
  clearFilters: {
    ...theme.typography.body2,
    minHeight: 40, border: "none", background: "transparent",
    color: theme.palette.primary.main, cursor: "pointer", padding: "0 8px",
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`},
  },
  filters: {
    marginTop: 24,
    marginBottom: 16,
    "& > div": {marginBottom: 20},
  },
  kinds: {
    marginTop: 12,
    marginBottom: 12,
    justifyContent: "flex-start",
    gap: 8,
  },
  postTypes: {flexWrap: "wrap"},
  resultCount: {
    ...theme.typography.body2,
    fontSize: 14,
    color: theme.palette.grey[700],
    marginBottom: 24,
  },
  result: {
    position: "relative",
    display: "flex",
    // Redistribute the row and hit's former bottom margins as vertical padding.
    padding: "12px 16px",
    scrollMarginTop: 'calc(var(--header-height) + 160px)',
    scrollMarginBottom: 16,
    "&:hover, &:focus-within, &[data-search-selected]": {
      backgroundColor: theme.palette.greyAlpha(0.12),
    },
    "& a:hover": {opacity: 1},
  },
  resultIcon: {
    display: "flex",
    position: "absolute",
    top: "50%",
    left: -38,
    transform: "translateY(-50%)",
    fontSize: 24,
    color: theme.palette.text.dim,
    "& > svg": {fontSize: "inherit"},
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 38,
    "& > div": {marginBottom: 0},
  },
  sortingHelp: {
    ...theme.typography.body2,
    fontSize: 13,
    color: theme.palette.text.dim,
    margin: "4px 0 8px",
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

const SearchPage = () => {
  // HACK: workaround for cacheComponents' background use of <Activity> breaking search in a lot of situations after navigation.
  const pathname = usePathname();
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const {location, query: urlQuery} = useSubscribedLocation();
  const currentUser = useCurrentUser();
  const captureSearch = useSearchAnalytics();
  const captureResultSelected = useCaptureSearchResultSelected();
  const hintId = useId();
  const sentinel = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const writtenSearch = useRef<string | null>(null);
  const observedSearch = useRef(location.search);
  const [expandedFilters, setExpandedFilters] = useState<string[]>(["sorting", "tags", "time", "events", "types", "authors", "karma"]);
  const [state, setState] = useState<SearchPageState>(() => searchPageStateFromQuery(urlQuery));
  const [inputFocused, setInputFocused] = useState(false);
  const [nowMs] = useState(() => Date.now());
  // The indexed archive includes material from 2003, before the configured site origin.
  const scale = {originMs: Math.min(new Date(searchOriginDate.get()).getTime(), Date.UTC(2003, 0, 1)), nowMs};
  const {recallSearch, recordSearch, resetNavigation} = useSearchHistory(currentUser?._id, true);

  // External navigation wins before writing local refinements back to the URL.
  useEffect(() => {
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
  }, [state, navigate, location.search]);

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
    }, {rootMargin: "0px 0px 400px 0px"});
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, error, hasMore, loadMore]);

  useEffect(() => {
    if (state.query) {
      captureSearch("searchPage", {...searchPageStateToQuery(state), query: state.query});
    }
  }, [state, captureSearch]);

  const setFilters = (patch: Partial<SearchFilterState>) => {
    setState(previous => ({...previous, filters: {...previous.filters, ...patch}}));
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
  const clearFilters = () => setState(previous => ({...previous, kinds: [], filters: {...emptySearchFilters, postTypes: defaultSearchPostTypes}}));
  const {dateRange, karmaRange} = state.filters;
  const hasDateFilter = dateRange.start !== undefined || dateRange.end !== undefined;
  const hasKarmaFilter = karmaRange.min !== undefined || karmaRange.max !== undefined;
  const hasPostFilter = state.filters.postTypes.length > 0 && state.filters.postTypes.length !== defaultSearchPostTypes.length;
  const hasFilters = hasDateFilter || hasKarmaFilter || hasPostFilter || state.filters.events !== "include" || !!state.filters.tagIds.length || !!state.filters.authorIds.length || !!state.kinds.length;
  const dateSummary = hasDateFilter ? `${dateRange.start === undefined ? "Beginning" : new Date(dateRange.start).toISOString().slice(0, 10)} – ${dateRange.end === undefined ? "Today" : new Date(dateRange.end).toISOString().slice(0, 10)}` : "All time";
  const showHistoryHint = !!currentUser && inputFocused && !state.query;

  return <div key={pathname} className={classes.root}>
    {/* Snippet widgets in the hit components need this context. Its static empty query does not search Elasticsearch. */}
    <InstantSearch indexName={getSearchIndexName("Posts")} searchClient={getSearchClient({emptyStringSearchResults: "empty"})}>
      <div className={classes.layout}>
        <aside className={classes.sidebar} aria-label="Search options">
          <SearchFilterRow
            label="Tune the sorting"
            summary={searchSortToUrlParam(state.sort) ? "Custom sorting" : ""}
            active={searchSortToUrlParam(state.sort) !== undefined}
            expanded={expandedFilters.includes("sorting")}
            onToggle={() => toggleFilter("sorting")}
            onReset={() => setState(previous => ({...previous, sort: defaultSearchSort}))}
          >
            <p className={classes.sortingHelp}>Drag a label to change priority; use its arrow to reverse the order. Later criteria only break ties.</p>
            <SearchSorterBar
              vertical
              sort={state.sort}
              onChange={(sort) => setState(previous => ({...previous, sort}))}
            />
          </SearchFilterRow>

          <div className={classes.filters}>
            <SearchFilterRow label="Wikitags" summary={state.filters.tagIds.length ? `${state.filters.tagIds.length} selected · match ${state.filters.tagMatch}` : "Any wikitag"} active={!!state.filters.tagIds.length} expanded={expandedFilters.includes("tags")} onToggle={() => toggleFilter("tags")} onReset={() => setFilters({tagIds: [], tagMatch: "any"})}>
              <SearchWikitagsBar match={state.filters.tagMatch} onMatchChange={(tagMatch) => setFilters({tagMatch})} tagIds={state.filters.tagIds} onChange={(tagIds) => setFilters({tagIds})} />
            </SearchFilterRow>
            <SearchFilterRow label="Timeframe" summary={dateSummary} active={hasDateFilter} expanded={expandedFilters.includes("time")} onToggle={() => toggleFilter("time")} onReset={() => setFilters({dateRange: {}})}>
              <SearchTimeframeBar value={state.filters.dateRange} onChange={(dateRange) => setFilters({dateRange})} scale={scale} />
            </SearchFilterRow>
            <SearchFilterRow label="Events" summary={state.filters.events === "include" ? "Included" : state.filters.events === "exclude" ? "Excluded" : "Only events"} active={state.filters.events !== "include"} expanded={expandedFilters.includes("events")} onToggle={() => toggleFilter("events")} onReset={() => setFilters({events: "include"})}>
              <SearchEventsBar value={state.filters.events} onChange={(events) => setFilters({events})} />
            </SearchFilterRow>
            <SearchFilterRow label="Post types" summary={hasPostFilter ? state.filters.postTypes.map(type => searchPostTypeLabels[type]).join(", ") : "All post types"} active={hasPostFilter} expanded={expandedFilters.includes("types")} onToggle={() => toggleFilter("types")} onReset={() => setFilters({postTypes: defaultSearchPostTypes})}>
              <SearchPostTypeBar className={classes.postTypes} selected={state.filters.postTypes} onChange={(postTypes) => setFilters({postTypes})} />
            </SearchFilterRow>
            <SearchFilterRow label="Authors" summary={state.filters.authorIds.length ? `${state.filters.authorIds.length} selected` : "Anyone"} active={!!state.filters.authorIds.length} expanded={expandedFilters.includes("authors")} onToggle={() => toggleFilter("authors")} onReset={() => setFilters({authorIds: []})}>
              <SearchAuthorsBar authorIds={state.filters.authorIds} onChange={(authorIds) => setFilters({authorIds})} />
            </SearchFilterRow>
            <SearchFilterRow label="Karma" summary={hasKarmaFilter ? `${state.filters.karmaRange.min ?? "Any"} to ${state.filters.karmaRange.max ?? "any"}` : "Any karma"} active={hasKarmaFilter} expanded={expandedFilters.includes("karma")} onToggle={() => toggleFilter("karma")} onReset={() => setFilters({karmaRange: {}})}>
              <SearchKarmaBar value={state.filters.karmaRange} onChange={(karmaRange) => setFilters({karmaRange})} />
            </SearchFilterRow>
            {hasFilters && <button type="button" className={classes.clearFilters} onClick={clearFilters}>Clear filters</button>}
          </div>

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
                  autoFocus
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
              </div>
              <LWTooltip title={`"Quotes" and -minus signs are supported. Use user:"Jane Doe" or wikitag:"Expected value" to filter by user or wikitag.`}>
                <InfoIcon className={classes.infoIcon} />
              </LWTooltip>
            </form>
            {showHistoryHint && <div id={hintId} className={classes.historyHint}>Shift+↑ / Shift+↓: search history</div>}

            <SearchKindBar
              className={classes.kinds}
              enabled={state.kinds}
              onClear={() => setState(previous => ({...previous, kinds: []}))}
              onToggle={(type) => setState(previous => ({...previous, kinds: toggleSearchKind(previous.kinds, type)}))}
            />
          </div>
          <div className={classes.resultsContent}>
            <ErrorBoundary>
              {total !== null && <div className={classes.resultCount} aria-live="polite">
                {total} result{total === 1 ? '' : 's'} · Sorted by {state.sort.map(spec => `${searchSortLabels[spec.key].toLowerCase()} ${spec.direction === 'desc' ? '↓' : '↑'}`).join(', then ')}
              </div>}
              <div ref={resultsRef} role="group" aria-label="Search results" aria-busy={loading}>
                {hits.map((hit, position) => {
                  const kind = searchKinds.find(({type}) => type.toLowerCase() === hit._index);
                  if (!kind) return null;
                  const Component = hitComponents[kind.type];
                  return <ErrorBoundary key={`${hit._index}:${hit._id}`}>
                    <div className={classes.result} data-search-result onClickCapture={(event) => {
                      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
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
                {hasFilters && <button type="button" className={classes.clearFilters} onClick={clearFilters}>Clear filters</button>}
              </div>}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </InstantSearch>
  </div>;
};

export default SearchPage;
