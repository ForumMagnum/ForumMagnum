import { Components, registerComponent, withCurrentUser} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Icon from '@material-ui/core/Icon';

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

    if (Users.canDo(currentUser, 'posts.moderate.all')) {
      return (
        <div className={classes.root}>
          <Icon className={classes.toggle} onClick={this.toggleSidebar}>
            { showSidebar ? "keyboard_arrow_down" : "keyboard_arrow_left"}
          </Icon>
          { showSidebar && <div>
            <Components.SunshineNewUsersList terms={{view:"sunshineNewUsers"}}/>
            <Components.SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
            <Components.SunshineReportedCommentsList terms={{view:"sunshineSidebarReports"}}/>
            <Components.SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>
            <Components.SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions"}}/>
          </div>}
        </div>
      )
    } else {
      return null
    }
  }
}

SunshineSidebar.propTypes = {
  currentUser: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

SunshineSidebar.displayName = "SunshineSidebar";

registerComponent('SunshineSidebar', SunshineSidebar, withCurrentUser, withStyles(styles, { name: 'SunshineSidebar'}));
