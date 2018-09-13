import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from 'meteor/example-forum';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';

const styles = theme => ({
  root: {
    backgroundColor: "rgba(120,120,0,.08)"
  }
})

class SunshineNewCommentsList extends Component {
  render () {
    const { results, classes } = this.props
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <Components.SunshineListTitle>
            Unreviewed Comments
          </Components.SunshineListTitle>
          {this.props.results.map(comment =>
            <div key={comment._id} >
              <Components.SunshineCommentsItem comment={comment}/>
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
};

registerComponent(
  'SunshineNewCommentsList',
  SunshineNewCommentsList,
  [withList, withListOptions],
  withUser,
  withStyles(styles, {name: "SunshineNewCommentsList"})
);
