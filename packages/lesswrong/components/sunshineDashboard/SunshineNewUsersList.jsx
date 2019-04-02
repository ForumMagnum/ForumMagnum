import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';

class SunshineNewUsersList extends Component {
  render () {
    const { results, totalCount } = this.props
    const { SunshineListCount, SunshineListTitle, SunshineNewUsersItem } = Components
    if (results && results.length && Users.canDo(this.props.currentUser, "posts.moderate.all")) {
      return (
        <div>
          <SunshineListTitle>
            New Users <SunshineListCount count={totalCount}/>
          </SunshineListTitle>
          {this.props.results.map(user =>
            <div key={user._id} >
              <SunshineNewUsersItem user={user}/>
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
  enableTotal: true,
  ssr: true
};

registerComponent('SunshineNewUsersList', SunshineNewUsersList, [withList, withListOptions], withUser);
