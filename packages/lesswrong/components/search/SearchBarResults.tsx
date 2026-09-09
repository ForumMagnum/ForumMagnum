import React, { useEffect, useRef, useState } from 'react';
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

import { SearchBarHit, useSearchBarResults } from './useSearchBarResults';
import classNames from 'classnames';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import LocalOfferOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/LocalOfferOutlined';
import ChatBubbleOutlineIcon from '@/lib/vendor/@material-ui/icons/src/ChatBubbleOutline';
import LocalLibraryIcon from '@/lib/vendor/@material-ui/icons/src/LocalLibrary';
import ArrowForwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowForward';

interface SearchType {
  type: SearchIndexCollectionName;
  label: string;
  Icon: typeof PersonIcon;
  Component: React.ComponentType<SearchHitComponentProps>;
}

const searchTypes: SearchType[] = [
  { type: "Users", label: "User", Icon: PersonIcon, Component: UsersSearchHit },
  { type: "Posts", label: "Post", Icon: DescriptionIcon, Component: PostsSearchHit },
  { type: "Tags", label: "Wiki entry", Icon: LocalOfferOutlinedIcon, Component: TagsSearchHit },
  { type: "Comments", label: "Comment", Icon: ChatBubbleOutlineIcon, Component: CommentsSearchHit },
  { type: "Sequences", label: "Sequence", Icon: LocalLibraryIcon, Component: SequencesSearchHit },
];

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
    display: "flex",
    justifyContent: "space-between",
    gap: 4,
    padding: "4px",
    overflowX: "auto",
    position: "sticky",
    top: 0,
    backgroundColor: theme.palette.panelBackground.default,
    zIndex: 1,
  },
  filter: {
    ...theme.typography.body2,
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "2px 6px",
    flexShrink: 0,
    whiteSpace: "nowrap",
    fontSize: 13,
    color: theme.palette.text.normal,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 3,
    minHeight: 40,
    boxSizing: "border-box",
    cursor: "pointer",
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: -2,
    },
    [theme.breakpoints.up('sm')]: {
      fontSize: 14,
      gap: 4,
      padding: "4px 8px",
    },
  },
  filterSelected: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  filterIcon: {
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
  searchActions: {
    position: "fixed",
    bottom: 0,
    right: 0,
    width: 500,
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "flex-end",
    padding: "4px 8px calc(4px + env(safe-area-inset-bottom))",
    backgroundColor: theme.palette.panelBackground.default,
    borderTop: theme.palette.greyBorder("1px", 0.1),
    zIndex: 2,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
    },
  },
  advancedSearch: {
    ...theme.typography.body2,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    padding: "0 10px",
    fontSize: 13,
    borderRadius: 3,
    color: theme.palette.primary.main,
    '&:hover, &:focus-visible': {
      backgroundColor: theme.palette.greyAlpha(0.08),
    },
  },
}))

function scrollFocusedResultIntoView(event: React.FocusEvent<HTMLDivElement>) {
  event.currentTarget.scrollIntoView({block: 'nearest'});
}

const SearchBarResults = ({closeSearch, currentQuery, open}: {
  closeSearch: () => void,
  currentQuery: string,
  open: boolean,
}) => {
  const classes = useStyles(styles);
  const captureResultSelected = useCaptureSearchResultSelected();
  const scrollArea = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [enabledTypes, setEnabledTypes] = useState<SearchIndexCollectionName[]>([]);

  const indexName = searchTypes.filter(({type}) => !enabledTypes.length || enabledTypes.includes(type))
    .map(({type}) => getSearchIndexName(type)).join(",");
  const {hits, loading, error, hasMore, loadMore} = useSearchBarResults(indexName, currentQuery, open);

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
    setEnabledTypes(previous => previous.includes(type)
      ? previous.filter(enabledType => enabledType !== type)
      : [...previous, type]);
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
    closeSearch();
  };

  return <div className={classNames(classes.root, {[classes.hidden]: !open})}>
    <div className={classes.searchResults} ref={scrollArea}>
        <div className={classes.filters} role="group" aria-label="Search content kinds">
          {searchTypes.map(({type, label, Icon}) => <span
            key={type}
            role="checkbox"
            tabIndex={0}
            className={classNames(classes.filter, {[classes.filterSelected]: enabledTypes.includes(type)})}
            aria-checked={enabledTypes.includes(type)}
            onClick={() => toggleType(type)}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                toggleType(type);
              }
            }}
          >
            <Icon className={classes.filterIcon} />
            {label}
          </span>)}
        </div>
        <div role="group" aria-label="Search results" aria-busy={loading}>
          {hits.map((hit, position) => {
            const searchType = searchTypes.find(({type}) => type.toLowerCase() === hit._index);
            if (!searchType) return null;
            const {type, Component} = searchType;
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
        {!loading && !error && !hits.length && <div className={classes.status}>
          No results found
        </div>}
    </div>
    <div className={classes.searchActions}>
      <Link to={`/search?query=${encodeURIComponent(currentQuery)}`} className={classes.advancedSearch} onClick={closeSearch}>
        <ArrowForwardIcon className={classes.filterIcon} />
        Advanced search
      </Link>
    </div>
  </div>
}

export default SearchBarResults;
