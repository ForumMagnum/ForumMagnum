import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { userCanDo, userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import withErrorBoundary from '../common/withErrorBoundary';
import { isLWorAF } from '../../lib/instanceSettings';

const styles = (theme: ThemeType) => ({
  root: {
    zIndex: theme.zIndexes.sunshineSidebar,
    position: "relative",
    display:"none",
    background: theme.palette.panelBackground.default,
    width: 210,
    [theme.breakpoints.up('lg')]: {
      display:"block"
    }
  },
  background: {
    background: theme.palette.panelBackground.default,
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
    color: theme.palette.grey[500],
    cursor: "pointer",
    
    "&:hover": {
      color: theme.palette.grey[800],
    },
  }
})

const SunshineSidebar = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const [showSidebar, setShowSidebar] = useState(false)
  const [showUnderbelly, setShowUnderbelly] = useState(false)
  const currentUser = useCurrentUser();

  const {
    SunshineNewUsersList,
    SunshineNewCommentsList,
    SunshineNewTagsList,
    SunshineNewPostsList,
    SunshineReportedContentList,
    SunshineCuratedSuggestionsList,
    AFSuggestUsersList,
    AFSuggestPostsList,
    AFSuggestCommentsList,
    SunshineGoogleServiceAccount,
  } = Components;

  if (!currentUser) return null

  const showInitialSidebar = userCanDo(currentUser, 'posts.moderate.all') || currentUser.groups?.includes('alignmentForumAdmins')
  const underbellyName = isLWorAF ? 'the Underbelly' : 'Low Priority'

  return (
    <div className={classes.root}>
      {showInitialSidebar && <div className={classes.background}>
        <SunshineGoogleServiceAccount />
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 7}}/>
        <SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
        <SunshineNewUsersList terms={{view:"sunshineNewUsers", limit: 10}} currentUser={currentUser}/>
        <SunshineReportedContentList currentUser={currentUser}/>
        <SunshineNewTagsList />
        
        {/* alignmentForumAdmins see AF content above the fold */}
        { currentUser.groups?.includes('alignmentForumAdmins') && <div>
          <AFSuggestPostsList />
          <AFSuggestCommentsList />
          <AFSuggestUsersList />
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
          <AFSuggestUsersList />
          <AFSuggestPostsList />
          <AFSuggestCommentsList />
        </div>}
      </div>}

      { showSidebar && <div>
        { showUnderbelly ? <div className={classes.toggle} onClick={() => setShowUnderbelly(false)}>
          Hide {underbellyName}
          <KeyboardArrowDownIcon/>
        </div>
        :
        <div className={classes.toggle} onClick={() => setShowUnderbelly(true)}>
          Show {underbellyName}
          <KeyboardArrowRightIcon/>
        </div>}
        { showUnderbelly && <div>
          <SunshineNewUsersList terms={{view:"allUsers", limit: 30}} currentUser={currentUser} />
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
