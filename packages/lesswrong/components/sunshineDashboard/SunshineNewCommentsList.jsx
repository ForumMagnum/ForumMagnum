import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    backgroundColor: "rgba(120,120,0,.08)"
  }
})

class SunshineNewCommentsList extends Component {
  render () {
    const { results, classes, totalCount } = this.props
    const { SunshineListCount, SunshineNewCommentsItem, SunshineListTitle } = Components
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <SunshineListTitle>
            Unreviewed Comments <SunshineListCount count={totalCount}/>
          </SunshineListTitle>
          {this.props.results.map(comment =>
            <div key={comment._id} >
              <SunshineNewCommentsItem comment={comment}/>
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
  collection: Comments,
  queryName: 'sunshineNewCommentsListQuery',
  fragmentName: 'SelectCommentsList',
  enableTotal: true,
};

SunshineNewCommentsList.propTypes = {
  results: PropTypes.array,
  classes: PropTypes.object.isRequired
};

registerComponent(
  'SunshineNewCommentsList',
  SunshineNewCommentsList,
  [withList, withListOptions],
  withUser,
  withStyles(styles, {name: "SunshineNewCommentsList"})
);
