import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';

const styles = theme => ({
  root: {
    opacity:.2,
    '&:hover': {
      opacity: 1,
    }
  }
})


class SunshineCuratedSuggestionsList extends Component {
  render () {
    const { results, classes } = this.props
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <Components.SunshineListTitle>Suggestions for Curated</Components.SunshineListTitle>
          {this.props.results.map(post =>
            <div key={post._id} >
              <Components.SunshineCuratedSuggestionsItem post={post}/>
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

const withListOptions = {
  collection: Posts,
  queryName: 'sunshineCuratedsuggestionsListQuery',
  fragmentName: 'PostsList',

};

registerComponent(
  'SunshineCuratedSuggestionsList',
  SunshineCuratedSuggestionsList,
  [withList, withListOptions],
  withUser,
  withStyles(styles, {name: "SunshineCuratedSuggestionsList"})
);
