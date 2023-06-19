import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Hits, Configure, Index, CurrentRefinements } from 'react-instantsearch-dom';
import { getAlgoliaIndexName } from '../../lib/search/algoliaUtil';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.text.normal,
    transition: "opacity .1s ease-in-out",
    zIndex: theme.zIndexes.searchResults,
    width:520,
    position: "fixed",
    right: 0,
    top: forumTypeSetting.get() === 'EAForum' ? 90 : 64,
    display: "flex",
    flexWrap: "wrap",
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    },
    [theme.breakpoints.down('xs')]: {
      top: forumTypeSetting.get() === 'EAForum' ? 78 : 48,
    },
  },
  searchResults: {
    overflow:"scroll",
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
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    '& h1': {
      margin:0
    }
  },
})

const SearchBarResults = ({closeSearch, currentQuery, classes}: {
  closeSearch: ()=>void,
  currentQuery: string,
  classes: ClassesType
}) => {
  const { PostsSearchHit, SequencesSearchHit, UsersSearchHit, TagsSearchHit, CommentsSearchHit } = Components

  return <div className={classes.root}>
    <div className={classes.searchResults}>
        <Components.ErrorBoundary>
          <div className={classes.list}>
            <Index indexName={getAlgoliaIndexName("Users")}>
              <Configure hitsPerPage={3} />
              <Hits hitComponent={(props) => <UsersSearchHit clickAction={closeSearch} {...props} showIcon/>} />
            </Index>
          </div>
        </Components.ErrorBoundary>
        <Components.ErrorBoundary>
          <div className={classes.list}>
            <Index indexName={getAlgoliaIndexName("Tags")}>
              <Configure hitsPerPage={3} />
              <Hits hitComponent={(props) => <TagsSearchHit clickAction={closeSearch} {...props} showIcon/>} />
            </Index>
          </div>
        </Components.ErrorBoundary>
        <Components.ErrorBoundary>
          <div className={classes.list}>
            <Index indexName={getAlgoliaIndexName("Posts")}>
              <Configure hitsPerPage={3} />
              <Hits hitComponent={(props) => <PostsSearchHit clickAction={closeSearch} {...props} showIcon/>} />
            </Index>
          </div>
        </Components.ErrorBoundary>
        <Components.ErrorBoundary>
          <div className={classes.list}>
            <Index indexName={getAlgoliaIndexName("Comments")}>
              <Configure hitsPerPage={3} />
              <Hits hitComponent={(props) => <CommentsSearchHit clickAction={closeSearch} {...props} showIcon/>} />
            </Index>
          </div>
        </Components.ErrorBoundary>
        <Components.ErrorBoundary>
          <div className={classes.list}>
            <Index indexName={getAlgoliaIndexName("Sequences")}>
              <Configure hitsPerPage={3} />
              <Hits hitComponent={(props) => <SequencesSearchHit clickAction={closeSearch} {...props} showIcon/>} />
            </Index>
          </div>
        </Components.ErrorBoundary>
        <Link to={`/search?query=${currentQuery}`} className={classes.seeAll}>
          See all results
        </Link>
    </div>
  </div>
}

const SearchBarResultsComponent = registerComponent("SearchBarResults", SearchBarResults, {styles});

declare global {
  interface ComponentTypes {
    SearchBarResults: typeof SearchBarResultsComponent
  }
}
