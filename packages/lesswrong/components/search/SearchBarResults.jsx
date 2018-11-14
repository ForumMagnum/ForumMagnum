import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import {
  Hits,
  Configure,
  Index } from 'react-instantsearch-dom';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.default,
    transition: "opacity .1s ease-in-out",
    height: 2000,
    width:"100%",
    overflow: "hidden",
    position: "absolute",
    left: 0,
    top: 64,
    [theme.breakpoints.down('small')]: {
      top:48,
    }
  },
  searchResults: {
    maxWidth: 1200,
    margin: "auto",
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
        <Components.ErrorBoundary>
          <Grid item xs={12} sm={6} md={5} className={classes.searchList}>
            <Index indexName="test_posts">
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
            <Index indexName="test_comments">
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
            <Index indexName= "test_users">
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
