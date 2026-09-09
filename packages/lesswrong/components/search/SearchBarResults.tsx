import React, { useCallback, useState } from 'react';
import { Hits, Configure } from 'react-instantsearch-dom';
import { SearchIndexCollectionName, getSearchIndexName } from '../../lib/search/searchUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { SearchHitComponentProps } from './types';
import { Index } from '../../lib/utils/componentsWithChildren';
import ErrorBoundary from "../common/ErrorBoundary";
import PostsSearchHit from "./PostsSearchHit";
import SequencesSearchHit from "./SequencesSearchHit";
import UsersSearchHit from "./UsersSearchHit";
import TagsSearchHit from "./TagsSearchHit";
import CommentsSearchHit from "./CommentsSearchHit";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useCaptureSearchResultSelected } from './useSearchAnalytics';

import classNames from 'classnames';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import LocalOfferOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/LocalOfferOutlined';
import ChatBubbleOutlineIcon from '@/lib/vendor/@material-ui/icons/src/ChatBubbleOutline';
import LocalLibraryIcon from '@/lib/vendor/@material-ui/icons/src/LocalLibrary';

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
    gap: 4,
    padding: "6px 4px 12px",
    marginBottom: 8,
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
    cursor: "pointer",
    "&:focus-visible": {
      backgroundColor: theme.palette.greyAlpha(0.18),
    },
  },
  filterSelected: {
    backgroundColor: theme.palette.greyAlpha(0.1),
  },
  filterIcon: {
    width: 14,
    height: 14,
  },
  searchResults: {
    overflowX: "hidden",
    overflowY: "scroll",
    width: "100%",
    height: "calc(100dvh - var(--header-height))",
    boxSizing: 'border-box',
    // Leave room for the sticky filters when scrolling a focused result into view.
    scrollPaddingTop: '56px',
    scrollPaddingBottom: '16px',
    backgroundColor: theme.palette.panelBackground.default,
    paddingBottom: 100,
    [theme.breakpoints.down('sm')]: {
      height: 'auto',
      maxHeight: 'calc(100dvh - var(--header-height) - 48px)',
      boxSizing: 'border-box',
      paddingBottom: 16,
    },
    [theme.breakpoints.up('md')]: {
      marginLeft: 20,
      boxShadow: theme.palette.boxShadow.searchResults,
    },
  },
  list: {
    '& .ais-Hits-list':{
      paddingTop: 6,
      paddingBottom: 4,
      borderBottom: theme.palette.border.grey300,
    },
    '& .ais-Hits-list:empty':{
      display:"none"
    },
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
  seeAll: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    marginTop: 10,
    display: "block",
    textAlign: "center",
    '&:focus-visible': {
      backgroundColor: theme.palette.greyAlpha(0.12),
    },
  },
  header: {
    cursor: "pointer",
    display:"flex",
    justifyContent:"space-between",
    alignItems: "center",
    paddingLeft: 8,
    paddingRight: 8,
    '& h1': {
      margin:0
    }
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
  const [enabledTypes, setEnabledTypes] = useState<SearchIndexCollectionName[]>(searchTypes.map(({type}) => type));

  const toggleType = (type: SearchIndexCollectionName) => {
    setEnabledTypes(previous => previous.includes(type)
      ? previous.filter(enabledType => enabledType !== type)
      : [...previous, type]);
  };

  const makeClickHandler = useCallback((type: SearchIndexCollectionName, hit: Record<string, unknown>) => () => {
    captureResultSelected({
      query: currentQuery,
      resultId: hit._id as string | undefined,
      resultType: type,
      position: hit.__position as number | undefined,
      indexName: getSearchIndexName(type),
      context: "searchBar",
    });
    closeSearch();
  }, [captureResultSelected, closeSearch, currentQuery]);

  return <div className={classNames(classes.root, {[classes.hidden]: !open})}>
    <div className={classes.searchResults}>
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
        {searchTypes.map(({ type, label, Component }) => (
          <ErrorBoundary key={type}>
            <div role="group" aria-label={`${label} results`} className={classNames(classes.list, {[classes.hidden]: !enabledTypes.includes(type)})}>
              <Index indexName={getSearchIndexName(type)}>
                <Configure hitsPerPage={3} />
                <Hits hitComponent={(props) => <div className={classes.result} data-search-result onFocus={scrollFocusedResultIntoView}>
                  <Component clickAction={makeClickHandler(type, props.hit)} {...props} showIcon/>
                </div>} />
              </Index>
            </div>
          </ErrorBoundary>
        ))}
        <Link to={`/search?query=${encodeURIComponent(currentQuery)}`} className={classes.seeAll}>
          See all results
        </Link>
    </div>
  </div>
}

export default SearchBarResults;
