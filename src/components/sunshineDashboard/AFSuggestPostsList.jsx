import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';

const styles = theme => ({
  icon: {
    marginRight: 4
  }
})


class AFSuggestPostsList extends Component {
  render () {
    const { results, classes } = this.props
    if (results && results.length) {
      return (
        <div>
          <Components.SunshineListTitle>
            <Components.OmegaIcon className={classes.icon}/> Suggested Posts
          </Components.SunshineListTitle>
          {this.props.results.map(post =>
            <div key={post._id} >
              <Components.AFSuggestPostsItem post={post}/>
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

AFSuggestPostsList.propTypes = {
  results: PropTypes.array,
  classes: PropTypes.object.isRequired
};

const withListOptions = {
  collection: Posts,
  queryName: 'SuggestionAlignmentListQuery',
  fragmentName: 'SuggestAlignmentPost',
  enableCache: true,
  fetchPolicy: 'cache-and-network',
};

registerComponent(
  'AFSuggestPostsList',
  AFSuggestPostsList,
  [withList, withListOptions],
  withUser,
  withStyles(styles, {name: "AFSuggestPostsList"})
);
