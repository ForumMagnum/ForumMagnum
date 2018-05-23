import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

class SunshineNewPostsList extends Component {
  render () {
    const results = this.props.results
    if (results && results.length && Users.canDo(this.props.currentUser, "posts.moderate.all")) {
      return (
        <div className="sunshine-new-posts-list">
          <div className="sunshine-sidebar-title">Unreviewed Posts</div>
          {this.props.results.map(post =>
            <div key={post._id} >
              <Components.SunshineNewPostsItem post={post}/>
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
  queryName: 'sunshineNewPostsListQuery',
  fragmentName: 'LWPostsList',
};

registerComponent('SunshineNewPostsList', SunshineNewPostsList, [withList, withListOptions], withCurrentUser);
