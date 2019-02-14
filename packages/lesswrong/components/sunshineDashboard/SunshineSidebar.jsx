import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import { defineComponent } from '../defineComponent';

const styles = theme => ({
  root: {
    position:"absolute",
    top:0,
    right:0,
    width:250,
    marginTop:63,
    zIndex: 1000,
    display:"none",
    [theme.breakpoints.up('lg')]: {
      display:"block"
    }
  },
  showSidebar: {
    background: "white",
  },
  toggle: {
    position:"relative",
    zIndex:1001,
    float: "right",
    margin: 12,
    cursor: "pointer",
    color: theme.palette.grey[400]
  }
})

class SunshineSidebar extends Component {
  state = { showSidebar: true }

  toggleSidebar = () => {
    this.setState({showSidebar: !this.state.showSidebar})
  }

  render () {
    const { currentUser, classes } = this.props
    const { showSidebar } = this.state
    
    return (
      <div className={classNames(classes.root, {[classes.showSidebar]:showSidebar})}>
        { showSidebar ? <KeyboardArrowDownIcon
          className={classes.toggle}
          onClick={this.toggleSidebar}/>
          :
          <KeyboardArrowLeftIcon
            className={classes.toggle}
            onClick={this.toggleSidebar}
          />}
        { showSidebar && Users.canDo(currentUser, 'posts.moderate.all') && <div>
          <Components.SunshineNewUsersList terms={{view:"sunshineNewUsers"}}/>
          <Components.SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
          <Components.SunshineReportedContentList terms={{view:"sunshineSidebarReports"}}/>
          <Components.SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>
          <Components.SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions"}}/>
        </div>}
        { showSidebar && currentUser.groups && currentUser.groups.includes('alignmentForumAdmins') && <div>
          <Components.AFSuggestUsersList terms={{view:"alignmentSuggestedUsers"}}/>
          <Components.AFSuggestPostsList terms={{view:"alignmentSuggestedPosts"}}/>
          <Components.AFSuggestCommentsList terms={{view:"alignmentSuggestedComments"}}/>
        </div>}
      </div>
    )
  }
}

SunshineSidebar.propTypes = {
  currentUser: PropTypes.object,
  classes: PropTypes.object.isRequired
};

SunshineSidebar.displayName = "SunshineSidebar";

export default defineComponent({
  name: "SunshineSidebar",
  component: SunshineSidebar,
  split: true,
  styles: styles,
  hocs: [withErrorBoundary, withUser],
});
