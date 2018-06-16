import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';

class SunshineNewUsersList extends Component {
  render () {
    const { results } = this.props
    if (results && results.length && Users.canDo(this.props.currentUser, "posts.moderate.all")) {
      return (
        <div className="sunshine-new-users-list">
          <div className="sunshine-sidebar-title">New Users</div>
          {this.props.results.map(user =>
            <div key={user._id} >
              <Components.SunshineNewUsersItem user={user}/>
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
  collection: Users,
  queryName: 'sunshineNewPostsListQuery',
  fragmentName: 'SunshineUsersList',
};

registerComponent('SunshineNewUsersList', SunshineNewUsersList, [withList, withListOptions], withCurrentUser);
