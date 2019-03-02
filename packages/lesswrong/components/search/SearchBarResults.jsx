import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Hits, Configure, Index, CurrentRefinements } from 'react-instantsearch-dom';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.default,
    color: "rgba(0,0,0, 0.87)",
    transition: "opacity .1s ease-in-out",
    height: 2000,
    width:"100%",
    overflow: "hidden",
    position: "absolute",
    left: 0,
    top: 64,
    [theme.breakpoints.down('small')]: {
      top:48,
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
    maxWidth: 1200,
    margin: "auto",
    paddingTop: 20
  },
  searchList: {
    padding:theme.spacing.unit*2
  },
  header: {
    display:"flex",
    justifyContent:"space-between",
    alignItems: "center",
    paddingTop: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    '& h1': {
      margin:0
    }
  },
})

class SearchBarResults extends Component {

  render() {
    const { classes, closeSearch } = this.props

    return <div className={classes.root}>
      <Grid container className={classes.searchResults}>
        <CurrentRefinements />
        <Components.ErrorBoundary>
          <Grid item xs={12} sm={6} md={5} className={classes.searchList}>
            <Index indexName={algoliaIndexNames.Posts}>
              <div className={classes.header}>
                <Typography variant="display1">Posts</Typography>
                <Components.SearchPagination />
              </div>

              <Configure hitsPerPage={7} />
              <Hits hitComponent={(props) => <Components.PostsSearchHit clickAction={closeSearch} {...props} />} />
            </Index>
          </Grid>
        </Components.ErrorBoundary>
        <Components.ErrorBoundary>
          <Grid item xs={12} sm={6} md={4} className={classes.searchList}>
            <Index indexName={algoliaIndexNames.Comments}>
              <div className={classes.header}>
                <Typography variant="display1">Comments</Typography>
                <Components.SearchPagination />
              </div>
              <Configure hitsPerPage={8} />
              <Hits hitComponent={(props) => <Components.CommentsSearchHit clickAction={closeSearch} {...props} />} />
            </Index>
          </Grid>
        </Components.ErrorBoundary>
        <Components.ErrorBoundary>
          <Grid item xs={12} sm={4} md={3} className={classes.searchList}>
            <Index indexName={algoliaIndexNames.Users}>
              <div className={classes.header}>
                <Typography variant="display1">Users</Typography>
                <Components.SearchPagination />
              </div>
              <Configure hitsPerPage={10} />
              <Hits hitComponent={(props) => <Components.UsersSearchHit clickAction={closeSearch} {...props} />} />
            </Index>
          </Grid>
        </Components.ErrorBoundary>
    </Grid>
  </div>
  }
}

registerComponent("SearchBarResults", SearchBarResults, withStyles(styles, {name: "SearchBarResults"}));
