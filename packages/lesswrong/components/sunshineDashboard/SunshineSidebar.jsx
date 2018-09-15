import { Components, registerComponent, withCurrentUser} from 'meteor/vulcan:core';
import React from 'react';
import Users from 'meteor/vulcan:users';
import defineComponent from '../../lib/defineComponent';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    position:"absolute",
    top:0,
    right:0,
    width:250,
    marginTop:63,
    background: "white",
    zIndex: 1000,
    display:"none",
    [theme.breakpoints.up('lg')]: {
      display:"block"
    }
  }
})

const SunshineSidebar = ({currentUser, classes}) => {
  if (Users.canDo(currentUser, 'posts.moderate.all')) {
    return (
      <div className={classes.root}>
        <Components.SunshineNewUsersList terms={{view:"sunshineNewUsers"}}/>
        <Components.SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
        <Components.SunshineReportedCommentsList terms={{view:"sunshineSidebarReports"}}/>
        <Components.SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>
        <Components.SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions"}}/>
      </div>
    )
  } else {
    return null
  }
};

SunshineSidebar.propTypes = {
  currentUser: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

export default defineComponent({
  name: 'SunshineSidebar',
  component: SunshineSidebar,
  styles: styles,
  hocs: [ withCurrentUser ]
});

