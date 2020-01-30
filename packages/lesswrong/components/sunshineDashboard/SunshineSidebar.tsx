import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = theme => ({
  root: {
    position:"absolute",
    top:0,
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
    position:"absolute",
    zIndex: theme.zIndexes.sunshineSidebar,
    float: "right",
    right: 0,
    margin: 12,
    cursor: "pointer",
    color: theme.palette.grey[400]
  }
})

interface ExternalProps {
}
interface SunshineSidebarProps extends ExternalProps, WithUserProps, WithStylesProps {
}
interface SunshineSidebarState {
  showSidebar: boolean,
  showUnderbelly: boolean,
}

class SunshineSidebar extends Component<SunshineSidebarProps,SunshineSidebarState> {
  state: SunshineSidebarState = { showSidebar: true, showUnderbelly: false }

  toggleSidebar = () => {
    this.setState({showSidebar: !this.state.showSidebar})
  }

  toggleUnderbelly = () => {
    // The stuff that was probably spam and hidden away from us so we wouldn't have to look at it, but sometimes turns out to be important
    this.setState({showUnderbelly: !this.state.showUnderbelly})
  }

  render () {
    const { currentUser, classes } = this.props
    const { showSidebar, showUnderbelly } = this.state
    const { SunshineNewUsersList, SunshineNewCommentsList, SunshineNewPostsList, SunshineReportedContentList, SunshineCuratedSuggestionsList, AFSuggestUsersList, AFSuggestPostsList, AFSuggestCommentsList, SunshineListTitle } = Components
    if (!currentUser) return null;

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
        { showSidebar && <div>
            {Users.canDo(currentUser, 'posts.moderate.all') && <div>
            <SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
            <SunshineNewUsersList terms={{view:"sunshineNewUsers", limit: 30}}/>
            <SunshineReportedContentList terms={{view:"sunshineSidebarReports", limit: 30}}/>
            {!!currentUser.viewUnreviewedComments && <SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>}
            <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 50}}/>
          </div>}
          { currentUser?.groups && currentUser.groups.includes('alignmentForumAdmins') && <div>
            <AFSuggestUsersList terms={{view:"alignmentSuggestedUsers"}}/>
            <AFSuggestPostsList terms={{view:"alignmentSuggestedPosts"}}/>
            <AFSuggestCommentsList terms={{view:"alignmentSuggestedComments"}}/>
          </div>}
        </div>}
        { showUnderbelly ? <div>
            <KeyboardArrowDownIcon
              className={classes.toggle}
              onClick={this.toggleUnderbelly}/>
            <SunshineListTitle>Hide the Underbelly</SunshineListTitle>
          </div>
          :
          <div>
            <KeyboardArrowLeftIcon
              className={classes.toggle}
              onClick={this.toggleUnderbelly}
            />
            <SunshineListTitle>Show the Underbelly</SunshineListTitle>
          </div>}
        { showUnderbelly && <div>
          <SunshineNewUsersList terms={{view:"sunshineNewUsers", limit: 30, ignoreRecaptcha: true, includeBioOnlyUsers: true}} allowContentPreview={false}/>
        </div>}

      </div>
    )
  }
}

const SunshineSidebarComponent = registerComponent<ExternalProps>("SunshineSidebar", SunshineSidebar, {
  styles,
  hocs: [withErrorBoundary, withUser]
});

declare global {
  interface ComponentTypes {
    SunshineSidebar: typeof SunshineSidebarComponent
  }
}

