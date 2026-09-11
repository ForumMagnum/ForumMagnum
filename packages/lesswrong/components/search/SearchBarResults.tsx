import React, { useCallback } from 'react';
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
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    },
    [theme.breakpoints.down('xs')]: {
      top: "var(--header-height)",
    },
  },
  searchResults: {
    overflowX: "hidden",
    overflowY: "scroll",
    width: "100%",
    height: "calc(100vh - 48px)",
    backgroundColor: theme.palette.panelBackground.default,
    paddingBottom: 100,
    [theme.breakpoints.up('md')]: {
      marginLeft: 20,
      boxShadow: theme.palette.boxShadow.searchResults,
      height: "calc(100vh - 64px)",
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
  seeAll: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    marginTop: 10,
    display: "block",
    textAlign: "center"
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

const SearchBarResults = ({closeSearch, currentQuery}: {
  closeSearch: () => void,
  currentQuery: string,
}) => {
  const classes = useStyles(styles);
  const captureResultSelected = useCaptureSearchResultSelected();
  const searchTypes: Array<{
    type: SearchIndexCollectionName;
    Component: React.ComponentType<SearchHitComponentProps>;
  }> = [
    { type: "Users", Component: UsersSearchHit },
    { type: "Posts", Component: PostsSearchHit },
    { type: "Tags", Component: TagsSearchHit },
    { type: "Comments", Component: CommentsSearchHit },
    { type: "Sequences", Component: SequencesSearchHit },
  ];

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

  return <div className={classes.root}>
    <div className={classes.searchResults}>
        {searchTypes.map(({ type, Component }) => (
          <ErrorBoundary key={type}>
            <div className={classes.list}>
              <Index indexName={getSearchIndexName(type)}>
                <Configure hitsPerPage={3} />
                <Hits hitComponent={(props) => <Component clickAction={makeClickHandler(type, props.hit)} {...props} showIcon/>} />
              </Index>
            </div>
          </ErrorBoundary>
        ))}
        <Link to={`/search?query=${currentQuery}`} className={classes.seeAll}>
          See all results
        </Link>
    </div>
  </div>
}

export default SearchBarResults;


