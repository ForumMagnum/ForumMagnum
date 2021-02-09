import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { userCanDo, userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    zIndex: theme.zIndexes.sunshineSidebar,
    position: "relative",
    display:"none",
    background: "white",
    [theme.breakpoints.up('lg')]: {
      display:"block"
    }
  },
  background: {
    background: "white"
  },
  toggle: {
    position: "relative",
    zIndex: theme.zIndexes.sunshineSidebar,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 8,
    whiteSpace: "nowrap",
    fontSize: "1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[400],
    cursor: "pointer",
  }
})

const SunshineSidebar = ({classes}: {classes: ClassesType}) => {
  const [showSidebar, setShowSidebar] = useState(false)
  const [showUnderbelly, setShowUnderbelly] = useState(false)
  const currentUser = useCurrentUser();

  const { SunshineNewUsersList, SunshineNewCommentsList, SunshineNewTagsList, SunshineNewPostsList, SunshineReportedContentList, SunshineCuratedSuggestionsList, AFSuggestUsersList, AFSuggestPostsList, AFSuggestCommentsList } = Components

  if (!currentUser) return null

  const showInitialSidebar = userCanDo(currentUser, 'posts.moderate.all') || currentUser.groups?.includes('alignmentForumAdmins')

  return (
    <div className={classes.root}>
      {showInitialSidebar && <div className={classes.background}>
        <SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
        <SunshineNewUsersList terms={{view:"sunshineNewUsers", limit: 10}}/>
        <SunshineReportedContentList terms={{view:"sunshineSidebarReports", limit: 30}}/>
        <SunshineNewTagsList />
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 7}}/>
        
        {/* alignmentForumAdmins see AF content above the fold */}
        { currentUser.groups?.includes('alignmentForumAdmins') && <div>
          <AFSuggestUsersList terms={{view:"alignmentSuggestedUsers", limit: 100}}/>
          <AFSuggestPostsList terms={{view:"alignmentSuggestedPosts"}}/>
          <AFSuggestCommentsList terms={{view:"alignmentSuggestedComments"}}/>
        </div>}
      </div>}

      {userCanDo(currentUser, 'posts.moderate.all') && <div>
        { showSidebar ? <div className={classes.toggle} onClick={() => setShowSidebar(false)}>
          Hide Full Sidebar
            <KeyboardArrowDownIcon />
          </div>
          :
          <div className={classes.toggle} onClick={() => setShowSidebar(true)}>
            Show Full Sidebar
            <KeyboardArrowRightIcon />
          </div>}
      </div>}


      { showSidebar && userCanDo(currentUser, 'posts.moderate.all') && <div>
        {!!currentUser!.viewUnreviewedComments && <SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>}        
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 50}} belowFold/>

        {/* regular admins (but not sunshines) see AF content below the fold */}
        { userIsAdmin(currentUser) && <div>
          <AFSuggestUsersList terms={{view:"alignmentSuggestedUsers", limit: 100}}/>
          <AFSuggestPostsList terms={{view:"alignmentSuggestedPosts"}}/>
          <AFSuggestCommentsList terms={{view:"alignmentSuggestedComments"}}/>
        </div>}
      </div>}

      { showSidebar && <div>
        { showUnderbelly ? <div className={classes.toggle} onClick={() => setShowUnderbelly(false)}>
          Hide Low Priority
          <KeyboardArrowDownIcon/>
        </div>
        :
        <div className={classes.toggle} onClick={() => setShowUnderbelly(true)}>
          Show Low Priority
          <KeyboardArrowRightIcon/>
        </div>}
        { showUnderbelly && <div>
          <SunshineNewUsersList terms={{view:"allUsers", limit: 30}} allowContentPreview={false}/>
        </div>}
      </div>}

    </div>
  )
}

const SunshineSidebarComponent = registerComponent("SunshineSidebar", SunshineSidebar, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineSidebar: typeof SunshineSidebarComponent
  }
}

