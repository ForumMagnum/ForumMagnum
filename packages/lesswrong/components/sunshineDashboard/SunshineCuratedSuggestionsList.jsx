import { Components, registerComponent } from 'meteor/vulcan:core';
import { withMulti } from '../../lib/crud/withMulti';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';


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
  [withMulti, withListOptions],
  withUser
);
