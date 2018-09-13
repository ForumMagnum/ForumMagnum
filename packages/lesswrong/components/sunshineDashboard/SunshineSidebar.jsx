import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';

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

const SunshineSidebar = (props) => {
  if (Users.canDo(props.currentUser, 'posts.moderate.all')) {
    return (
      <div className={props.classes.root}>
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

SunshineSidebar.displayName = "SunshineSidebar";

registerComponent('SunshineSidebar', SunshineSidebar, withUser, withStyles(styles, { name: 'SunshineSidebar'}));
