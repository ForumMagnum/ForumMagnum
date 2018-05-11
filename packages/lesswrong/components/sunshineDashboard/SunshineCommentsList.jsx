import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

class SunshineCommentsList extends Component {
  render () {
    const results = this.props.results
    if (results && results.length && Users.canDo(this.props.currentUser, "posts.moderate.all")) {
      return (
        <div className="sunshine-new-posts-list">
          <div className="sunshine-sidebar-title">Unreviewed Comments</div>
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
  queryName: 'sunshineCommentsListQuery',
  fragmentName: 'SelectCommentsList',
};

registerComponent(
  'SunshineCommentsList',
  SunshineCommentsList,
  [withList, withListOptions],
  withCurrentUser
);
