import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';

const styles = theme => ({
  icon: {
    marginRight: 4
  }
})


class AFSuggestCommentsList extends Component {
  render () {
    const { results, classes } = this.props
    if (results && results.length) {
      return (
        <div>
          <Components.SunshineListTitle>
            <Components.OmegaIcon className={classes.icon}/> AF Suggested Comments
          </Components.SunshineListTitle>
          {this.props.results.map(post =>
            <div key={post._id} >
              <Components.AFSuggestCommentsItem post={post}/>
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

AFSuggestCommentsList.propTypes = {
  results: PropTypes.array,
  classes: PropTypes.object.isRequired
};

const withListOptions = {
  collection: Comments,
  queryName: 'SuggestionAlignmentListQuery',
  fragmentName: 'SuggestAlignmentComment',
  enableCache: true,
  fetchPolicy: 'cache-and-network',
};

registerComponent(
  'AFSuggestCommentsList',
  AFSuggestCommentsList,
  [withList, withListOptions],
  withUser,
  withStyles(styles, {name: "AFSuggestCommentsList"})
);
