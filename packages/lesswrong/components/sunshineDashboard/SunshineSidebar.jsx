import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';

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

  renderSidebar = () => {
    const { currentUser } = this.props
    return Users.canDo(currentUser, 'posts.moderate.all') ||
    Users.canDo(currentUser, 'alignment.sidebar')
  }

  render () {
    const { currentUser, classes } = this.props
    const { showSidebar } = this.state

    if (this.renderSidebar()) {
      return (
        <div className={classes.root}>
          { showSidebar ? <KeyboardArrowDownIcon
            className={classes.toggle}
            onClick={this.toggleSidebar}/>
            :
            <KeyboardArrowLeftIcon
              className={classes.toggle}
              onClick={this.toggleSidebar}
            />}
          { Users.canDo(currentUser, 'posts.moderate.all') && <div>
            <Components.SunshineNewUsersList terms={{view:"sunshineNewUsers"}}/>
            <Components.SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
            <Components.SunshineReportedCommentsList terms={{view:"sunshineSidebarReports"}}/>
            <Components.SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>
            <Components.SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions"}}/>
          </div>}
          { Users.canDo(currentUser, 'alignment.sidebar') && <div>
            <Components.SuggestAlignmentList terms={{view:"alignmentSuggestions"}}/>
          </div>}
        </div>
      )
    } else {
      return null
    }
  }
}

SunshineSidebar.propTypes = {
  currentUser: PropTypes.object,
  classes: PropTypes.object.isRequired
};

SunshineSidebar.displayName = "SunshineSidebar";

registerComponent('SunshineSidebar', SunshineSidebar, withUser, withStyles(styles, { name: 'SunshineSidebar'}));
