import { Components, registerComponent } from 'meteor/vulcan:core';
import { withMulti } from '../../lib/crud/withMulti';
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
            <div><Components.OmegaIcon className={classes.icon}/> Suggested Comments</div>
          </Components.SunshineListTitle>
          {this.props.results.map(comment =>
            <div key={comment._id} >
              <Components.AFSuggestCommentsItem comment={comment}/>
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
  fetchPolicy: 'cache-and-network',
};

registerComponent(
  'AFSuggestCommentsList',
  AFSuggestCommentsList,
  [withMulti, withListOptions],
  withUser,
  withStyles(styles, {name: "AFSuggestCommentsList"})
);
