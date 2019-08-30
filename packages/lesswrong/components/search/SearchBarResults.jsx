import React, { Component } from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import { Hits, Configure, Index, CurrentRefinements } from 'react-instantsearch-dom';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const styles = theme => ({
  root: {
    color: "rgba(0,0,0, 0.87)",
    transition: "opacity .1s ease-in-out",
    zIndex: theme.zIndexes.searchResults,
    width:520,
    position: "fixed",
    right: 0,
    top: getSetting('forumType') === 'EAForum' ? 90 : 64,
    display: "flex",
    flexWrap: "wrap",
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    },
    [theme.breakpoints.down('xs')]: {
      top: 48,
    },
    "& .ais-CurrentRefinements": {
      display: 'inline-block',
      position: 'absolute',
      padding: '0px 16px',
      top: 16
    },
    "& .ais-CurrentRefinements-item": {
      border: '1px solid rgba(0,0,0,0.3)',
      borderRadius: 20,
      padding: '8px',
    },
    "& .ais-CurrentRefinements-label": {
      marginRight: 5
    },
  },
  searchResults: {
    overflow:"scroll",
    width: "100%",
    height: "calc(100vh - 48px)",
    backgroundColor: theme.palette.background.default,
    paddingBottom: 100,
    [theme.breakpoints.up('md')]: {
      marginLeft: 20,
      boxShadow: "0 0 20px rgba(0,0,0,.2)",
      height: "calc(100vh - 64px)",
    },
  },
  searchList: {
    borderBottom: "solid 1px rgba(0,0,0,.3)",
    paddingTop:theme.spacing.unit,
    paddingBottom:theme.spacing.unit,
    paddingLeft:theme.spacing.unit*2,
    paddingRight:theme.spacing.unit*2
  },
  loadMore: {
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main
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
    },
    '&:hover': {
      opacity: .5,
    }
  },
})

class SearchBarResults extends Component {
  state = { type: "all", userCount: 3, postCount: 3, commentCount: 3}

  loadMoreUsers = () => {
    this.setState((prevState) => ({
      type: prevState.type === 'all' ? 'users' : 'all',
      userCount: 15
    }))
  }

  loadMorePosts = () => {
    this.setState((prevState) => ({
      type: prevState.type === 'all' ? 'posts' : 'all',
      postCount: 15
    }))
  }

  loadMoreComments = () => {
    this.setState((prevState) => ({
      type: prevState.type === 'all' ? 'comments' : 'all',
      commentCount: 15
    }))
  }

  render() {
    const { classes, closeSearch } = this.props
    const { type, userCount, postCount, commentCount } = this.state

    const showUsers = type === "all" || type === "users"
    const showPosts = type === "all" || type === "posts"
    const showComments = type === "all" || type === "comments"

    return <div className={classes.root}>
      <div className={classes.searchResults}>
        <CurrentRefinements />
        <Components.ErrorBoundary>
          <div item xs={12} sm={4} md={3} className={classes.searchList}>
            <Index indexName={algoliaIndexNames.Users}>
              <div className={classes.header} onClick={this.loadMoreUsers}>
                <Typography variant="body2">Users</Typography>
                {/* <Components.SearchPagination /> */}
                <div className={classes.loadMore}>
                  {type === "users" ? "Fewer" : "More"} Users
                </div>
              </div>
              <Configure hitsPerPage={type === "users" ? userCount : 3} />
              {showUsers && <Hits hitComponent={(props) => <Components.UsersSearchHit clickAction={closeSearch} {...props} />} />}
            </Index>
          </div>
        </Components.ErrorBoundary>
        <Components.ErrorBoundary>
          <div className={classes.searchList}>
            <Index indexName={algoliaIndexNames.Posts}>
              <div className={classes.header} onClick={this.loadMorePosts}>
                <Typography variant="body2">Posts</Typography>
                {/* <Components.SearchPagination /> */}
                <div className={classes.loadMore}>
                  {type === "posts" ? "Fewer" : "More"} Posts
                </div>
              </div>

              <Configure hitsPerPage={type === "posts" ? postCount : 3} />
              {showPosts && <Hits hitComponent={(props) => <Components.PostsSearchHit clickAction={closeSearch} {...props} />} />}
            </Index>
          </div>
        </Components.ErrorBoundary>
        <Components.ErrorBoundary>
          <div className={classes.searchList}>
            <Index indexName={algoliaIndexNames.Comments}>
              <div className={classes.header} onClick={this.loadMoreComments}>
                <Typography variant="body2">Comments</Typography>
                <div className={classes.loadMore}>
                  {type === "comments" ? "Fewer" : "More"} Comments
                </div>
              </div>
              <Configure hitsPerPage={type === "comments" ? commentCount : 3} />
              {showComments && <Hits hitComponent={(props) => <Components.CommentsSearchHit clickAction={closeSearch} {...props} />} />}
            </Index>
          </div>
        </Components.ErrorBoundary>
    </div>
  </div>
  }
}

registerComponent("SearchBarResults", SearchBarResults, withStyles(styles, {name: "SearchBarResults"}));
