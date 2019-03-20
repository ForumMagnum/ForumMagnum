import { Components } from 'meteor/vulcan:core';
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
    // TODO JP just hacked this, should actually figure out how to get it to
    // float beneath the header properly
    top:30,
    right:0,
    width:250,
    marginTop:63,
    zIndex: theme.zIndexes.sunshineSidebar,
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
    zIndex: theme.zIndexes.sunshineSidebar,
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
    const { SunshineNewUsersList, SunshineNewCommentsList, SunshineNewPostsList, SunshineReportedContentList, SunshineCuratedSuggestionsList, AFSuggestUsersList, AFSuggestPostsList, AFSuggestCommentsList } = Components
    
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
          <SunshineNewUsersList terms={{view:"sunshineNewUsers"}}/>
          <SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
          <SunshineReportedContentList terms={{view:"sunshineSidebarReports"}}/>
          {!!currentUser.viewUnreviewedComments && <SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>}
          <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions"}}/>
        </div>}
        { showSidebar && currentUser.groups && currentUser.groups.includes('alignmentForumAdmins') && <div>
          <AFSuggestUsersList terms={{view:"alignmentSuggestedUsers"}}/>
          <AFSuggestPostsList terms={{view:"alignmentSuggestedPosts"}}/>
          <AFSuggestCommentsList terms={{view:"alignmentSuggestedComments"}}/>
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
