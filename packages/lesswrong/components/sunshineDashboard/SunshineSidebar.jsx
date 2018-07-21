import { Components, registerComponent, withCurrentUser} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';

class SunshineSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    if (this.state.error) {
      return <div className="errorText">Error rendering Sunshine Sidebar: {this.state.error}</div>
    }
    
    if (Users.canDo(this.props.currentUser, 'posts.moderate.all')) {
      return (
        <div className="sunshine-sidebar">
          <Components.SunshineNewUsersList terms={{view:"sunshineNewUsers"}}/>
          <Components.SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
          <Components.SunshineReportedCommentsList terms={{view:"sunshineSidebarReports"}}/>
          <Components.SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>
          <hr/>
          <Components.SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions"}}/>
        </div>
      )
    } else {
      return null
    }
  }
  
  componentDidCatch(error, info) {
    this.setState({error:error.toString()});
  }
}

SunshineSidebar.displayName = "SunshineSidebar";

registerComponent('SunshineSidebar', SunshineSidebar, withCurrentUser);
