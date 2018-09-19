import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';

class SunshineNewUsersList extends Component {
  render () {
    const { results } = this.props
    if (results && results.length && Users.canDo(this.props.currentUser, "posts.moderate.all")) {
      return (
        <div>
          <Components.SunshineListTitle>
            New Users
          </Components.SunshineListTitle>
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

SunshineNewUsersList.propTypes = {
  results: PropTypes.array,
};

const withListOptions = {
  collection: Users,
  queryName: 'sunshineNewPostsListQuery',
  fragmentName: 'SunshineUsersList',
};

registerComponent('SunshineNewUsersList', SunshineNewUsersList, [withList, withListOptions], withUser);
