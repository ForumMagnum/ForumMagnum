import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { useState } from 'react';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import { withStyles } from '@material-ui/core/styles';

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
    position: "relative",
    zIndex: theme.zIndexes.sunshineSidebar,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 8,
    width: "100%",
    fontSize: "1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[400],
    cursor: "pointer",
  }
})

const SunshineSidebar = ({currentUser, classes}) => {
  const [showSidebar, setShowSidebar] = useState(false)
  const [showUnderbelly, setShowUnderbelly] = useState(false)

  const { SunshineNewUsersList, SunshineNewCommentsList, SunshineNewPostsList, SunshineReportedContentList, SunshineCuratedSuggestionsList, AFSuggestUsersList, AFSuggestPostsList, AFSuggestCommentsList, SunshineListTitle } = Components

  return (
    <div className={classNames(classes.root, {[classes.showSidebar]:showSidebar})}>
      {Users.canDo(currentUser, 'posts.moderate.all') && <div>
        <SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
        <SunshineNewUsersList terms={{view:"sunshineNewUsers", limit: 30}}/>
        <SunshineReportedContentList terms={{view:"sunshineSidebarReports", limit: 30}}/>
      </div>}

      { showSidebar ? <div className={classes.toggle} onClick={() => setShowSidebar(false)}>
        Hide Full Sidebar
          <KeyboardArrowDownIcon />
        </div>
        :
        <div className={classes.toggle} onClick={() => setShowSidebar(true)}>
          Show Full Sidebar
          <KeyboardArrowRightIcon />
        </div>}

      { showSidebar && <div>
        {!!currentUser.viewUnreviewedComments && <SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>}
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 50}}/>
        { currentUser.groups && currentUser.groups.includes('alignmentForumAdmins') && <div>
          <AFSuggestUsersList terms={{view:"alignmentSuggestedUsers"}}/>
          <AFSuggestPostsList terms={{view:"alignmentSuggestedPosts"}}/>
          <AFSuggestCommentsList terms={{view:"alignmentSuggestedComments"}}/>
        </div>}
      </div>}

      { showSidebar && <div>
        { showUnderbelly ? <div onClick={() => setShowUnderbelly(false)}>
          <SunshineListTitle>
            Hide the Underbelly
            <KeyboardArrowDownIcon/>
          </SunshineListTitle>
        </div>
        :
        <div onClick={() => setShowUnderbelly(true)}>
          <SunshineListTitle>
            Show the Underbelly
            <KeyboardArrowRightIcon/>
          </SunshineListTitle>
        </div>}
        { showUnderbelly && <div>
          <SunshineNewUsersList terms={{view:"sunshineNewUsers", limit: 30, ignoreRecaptcha: true, includeBioOnlyUsers: true}} allowContentPreview={false}/>
        </div>}
      </div>}

    </div>
  )
}

SunshineSidebar.propTypes = {
  currentUser: PropTypes.object,
  classes: PropTypes.object.isRequired
};

/*export default defineComponent({
  name: "SunshineSidebar",
  component: SunshineSidebar,
  split: true,
  styles: styles,
  hocs: [withErrorBoundary, withUser],
});*/
registerComponent("SunshineSidebar", SunshineSidebar, withStyles(styles, {name: "SunshineSidebar"}), withErrorBoundary, withUser);
