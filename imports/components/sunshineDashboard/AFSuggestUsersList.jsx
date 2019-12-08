import { Components as C, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';
import Users from "meteor/vulcan:users";

const styles = theme => ({
  icon: {
    marginRight: 4
  }
})


class AFSuggestUsersList extends Component {
  render () {
    const { results, classes } = this.props
    if (results && results.length) {
      return (
        <div>
          <C.SunshineListTitle>
            <C.OmegaIcon className={classes.icon}/> Suggested Users
          </C.SunshineListTitle>
          {this.props.results.map(user =>
            <div key={user._id} >
              <C.AFSuggestUsersItem user={user}/>
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

AFSuggestUsersList.propTypes = {
  results: PropTypes.array,
  classes: PropTypes.object.isRequired
};

const withListOptions = {
  collection: Users,
  queryName: 'SuggestionAlignmentUserQuery',
  fragmentName: 'SuggestAlignmentUser',
  fetchPolicy: 'cache-and-network',
};

registerComponent(
  'AFSuggestUsersList',
  AFSuggestUsersList,
  [withList, withListOptions],
  withUser,
  withStyles(styles, {name: "AFSuggestUsersList"})
);
