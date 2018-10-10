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
  },
  icon: {
    marginRight: 4
  }
})


class SuggestAlignmentList extends Component {
  render () {
    const { results, classes } = this.props
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <Components.SunshineListTitle>
            <Components.OmegaIcon className={classes.icon}/> Suggest for Alignment
          </Components.SunshineListTitle>
          {this.props.results.map(post =>
            <div key={post._id} >
              <Components.SuggestAlignmentItem post={post}/>
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

SuggestAlignmentList.propTypes = {
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
  'SuggestAlignmentList',
  SuggestAlignmentList,
  [withList, withListOptions],
  withUser,
  withStyles(styles, {name: "SuggestAlignmentList"})
);
