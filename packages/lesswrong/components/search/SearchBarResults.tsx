import React, { useEffect, useRef } from 'react';
import { SearchIndexCollectionName, getSearchIndexName } from '../../lib/search/searchUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { SearchHitComponentProps } from './types';
import ErrorBoundary from "../common/ErrorBoundary";
import PostsSearchHit from "./PostsSearchHit";
import SequencesSearchHit from "./SequencesSearchHit";
import UsersSearchHit from "./UsersSearchHit";
import TagsSearchHit from "./TagsSearchHit";
import CommentsSearchHit from "./CommentsSearchHit";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useCaptureSearchResultSelected } from './useSearchAnalytics';

import { SearchBarHit, useSearchResults } from './useSearchResults';
import { searchPageLink } from './searchPageUrl';
import SearchKindBar, { searchKinds, toggleSearchKind } from './SearchKindBar';
import classNames from 'classnames';
import ArrowForwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowForward';

const hitComponents: Record<SearchIndexCollectionName, React.ComponentType<SearchHitComponentProps>> = {
  Users: UsersSearchHit,
  Posts: PostsSearchHit,
  Tags: TagsSearchHit,
  Comments: CommentsSearchHit,
  Sequences: SequencesSearchHit,
};

const styles = defineStyles("SearchBarResults", (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.normal,
    transition: "opacity .1s ease-in-out",
    zIndex: theme.zIndexes.searchResults,
    width: 520,
    position: "fixed",
    right: 0,
    top: "var(--header-height)",
    display: "flex",
    flexWrap: "wrap",
    '& :focus': {
      outline: 'none',
    },
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      top: "calc(var(--header-height) + 48px)",
    },
  },
  hidden: {
    display: "none",
  },
  filters: {
    position: "sticky",
    top: 0,
    backgroundColor: theme.palette.panelBackground.default,
    zIndex: 1,
  },
  advancedSearchIcon: {
    width: 14,
    height: 14,
    [theme.breakpoints.up('sm')]: {
      width: 16,
      height: 16,
    },
  },
  searchResults: {
    overflowX: "hidden",
    overflowY: "scroll",
    width: "100%",
    height: "calc(100dvh - var(--header-height))",
    boxSizing: 'border-box',
    // Leave room for the sticky filters when scrolling a focused result into view.
    scrollPaddingTop: '48px',
    scrollPaddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
    backgroundColor: theme.palette.panelBackground.default,
    paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100dvh - var(--header-height) - 48px)',
      maxHeight: 'calc(100dvh - var(--header-height) - 48px)',
      boxSizing: 'border-box',
    },
    [theme.breakpoints.up('md')]: {
      marginLeft: 20,
      boxShadow: theme.palette.boxShadow.searchResults,
      // Keep the dropdown shadow below the search bar while preserving it on the other edges.
      clipPath: 'inset(0 -40px -40px)',
    },
  },
  status: {
    ...theme.typography.body2,
    padding: 12,
    textAlign: "center",
  },
  result: {
    position: "relative",
    scrollMarginBlock: '8px',
    "&:hover, &:focus-within, &[data-search-selected]": {
      backgroundColor: theme.palette.greyAlpha(0.12),
    },
    "& a": {
      flex: 1,
      minWidth: 0,
      "&:hover": {
        opacity: 1,
      },
      "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
      },
    },
  },
  advancedSearch: {
    ...theme.typography.body2,
    position: "absolute",
    bottom: "calc(12px + env(safe-area-inset-bottom))",
    right: 12,
    zIndex: 2,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    padding: "0 12px",
    fontSize: 13,
    borderRadius: 3,
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder("1px", 0.2),
    boxShadow: `0 2px 8px ${theme.palette.boxShadowColor(0.16)}`,
    '&:hover, &:focus-visible': {
      backgroundColor: theme.palette.grey[100],
      opacity: 1,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  },
}))

function scrollFocusedResultIntoView(event: React.FocusEvent<HTMLDivElement>) {
  event.currentTarget.scrollIntoView({block: 'nearest'});
}

const SearchBarResults = ({closeSearch, recordSearch, currentQuery, open, searchHistoryControls, enabledTypes, onKindsChange}: {
  enabledTypes: SearchIndexCollectionName[],
  onKindsChange: (kinds: SearchIndexCollectionName[]) => void,
  closeSearch: () => void,
  recordSearch: () => void,
  searchHistoryControls: React.ReactNode,
  currentQuery: string,
  open: boolean,
}) => {
  const classes = useStyles(styles);
  const captureResultSelected = useCaptureSearchResultSelected();
  const scrollArea = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const indexName = searchKinds.filter(({type}) => !enabledTypes.length || enabledTypes.includes(type))
    .map(({type}) => getSearchIndexName(type)).join(",");
  const {hits, loading, error, hasMore, total, loadMore} = useSearchResults({indexName, query: currentQuery}, open);

  useEffect(() => {
    const area = scrollArea.current;
    const target = sentinel.current;
    if (!open || !area || !target || loading || error || !hasMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void loadMore();
    }, {root: area, rootMargin: "0px 0px 100px 0px"});
    observer.observe(target);
    return () => observer.disconnect();
  }, [open, loading, error, hasMore, loadMore]);

  useEffect(() => {
    const area = scrollArea.current;
    const fetchNextPage = () => { void loadMore(); };
    area?.addEventListener('search-load-more', fetchNextPage);
    return () => area?.removeEventListener('search-load-more', fetchNextPage);
  }, [loadMore]);

  const toggleType = (type: SearchIndexCollectionName) => {
    onKindsChange(toggleSearchKind(enabledTypes, type));
  };

  const selectHit = (type: SearchIndexCollectionName, hit: SearchBarHit, position: number) => {
    captureResultSelected({
      query: currentQuery,
      resultId: hit._id,
      resultType: type,
      position,
      indexName: getSearchIndexName(type),
      context: "searchBar",
    });
    recordSearch();
    closeSearch();
  };

  return <div className={classNames(classes.root, {[classes.hidden]: !open})}>
    <div className={classes.searchResults} ref={scrollArea}>
        {searchHistoryControls}
        <SearchKindBar className={classes.filters} enabled={enabledTypes} onToggle={toggleType} onClear={() => onKindsChange([])} />
        <div role="group" aria-label="Search results" aria-busy={loading}>
          {hits.map((hit, position) => {
            const searchKind = searchKinds.find(({type}) => type.toLowerCase() === hit._index);
            if (!searchKind) return null;
            const {type} = searchKind;
            const Component = hitComponents[type];
            return <ErrorBoundary key={`${hit._index}:${hit._id}`}>
              <div className={classes.result} data-search-result onFocus={scrollFocusedResultIntoView}>
                <Component hit={hit} clickAction={() => selectHit(type, hit, position)} showIcon />
              </div>
            </ErrorBoundary>;
          })}
        </div>
        <div ref={sentinel} />
        {loading && <div className={classes.status} role="status">Loading results…</div>}
        {error && <div className={classes.status} role="status">
          Could not load results. <button onClick={() => { void loadMore(); }}>Try again</button>
        </div>}
        {!loading && !error && total !== null && !hits.length && <div className={classes.status}>
          No results found
        </div>}
    </div>
    <Link to={searchPageLink(currentQuery, enabledTypes)} className={classes.advancedSearch} onClick={() => { recordSearch(); closeSearch(); }}>
      <ArrowForwardIcon className={classes.advancedSearchIcon} />
      Advanced search
    </Link>
  </div>
}

export default SearchBarResults;
