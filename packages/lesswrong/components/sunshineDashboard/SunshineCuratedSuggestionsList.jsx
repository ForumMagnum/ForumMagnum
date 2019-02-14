import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';

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
    const { SunshineListTitle, SunshineCuratedSuggestionsItem, LastCuratedDate } = Components
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <SunshineListTitle>
            Suggestions for Curated
            <LastCuratedDate terms={{view:'curated', limit:1}}/>
          </SunshineListTitle>
          {this.props.results.map(post =>
            <div key={post._id} >
              <SunshineCuratedSuggestionsItem post={post}/>
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

SunshineCuratedSuggestionsList.propTypes = {
  results: PropTypes.array,
  classes: PropTypes.object.isRequired
};

const withListOptions = {
  collection: Posts,
  queryName: 'sunshineCuratedsuggestionsListQuery',
  fragmentName: 'PostsList'
};

registerComponent(
  'SunshineCuratedSuggestionsList',
  SunshineCuratedSuggestionsList,
  [withList, withListOptions],
  withUser,
  withStyles(styles, {name: "SunshineCuratedSuggestionsList"})
);
