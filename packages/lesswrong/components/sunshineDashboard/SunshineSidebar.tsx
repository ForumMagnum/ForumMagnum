import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import { userCanDo, userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import KeyboardArrowDownIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowRight';
import withErrorBoundary from '../common/withErrorBoundary';
import { isLWorAF } from '../../lib/instanceSettings';
import SunshineNewUsersList from "./SunshineNewUsersList";
import SunshineNewCommentsList from "./SunshineNewCommentsList";
import SunshineNewTagsList from "./SunshineNewTagsList";
import SunshineNewPostsList from "./SunshineNewPostsList";
import SunshineReportedContentList from "./SunshineReportedContentList";
import SunshineCuratedSuggestionsList from "./SunshineCuratedSuggestionsList";
import AFSuggestUsersList from "./AFSuggestUsersList";
import AFSuggestPostsList from "./AFSuggestPostsList";
import AFSuggestCommentsList from "./AFSuggestCommentsList";
import SunshineGoogleServiceAccount from "./SunshineGoogleServiceAccount";

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
  const [showUnderbelly, setShowUnderbelly] = useState(false)
  const currentUser = useCurrentUser();
  if (!currentUser) return null

  const showInitialSidebar = userCanDo(currentUser, 'posts.moderate.all') || currentUser.groups?.includes('alignmentForumAdmins')
  const underbellyName = isLWorAF ? 'the Underbelly' : 'Low Priority'

  return (
    <div className={classes.root}>
      {showInitialSidebar && <div className={classes.background}>
        <SunshineGoogleServiceAccount />
        <SunshineNewPostsList terms={{view:"sunshineNewPosts"}}/>
        <SunshineNewUsersList terms={{view:"sunshineNewUsers", limit: 10}} currentUser={currentUser}/>
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 7}}/>
        <SunshineReportedContentList currentUser={currentUser}/>
        <SunshineNewTagsList />
        
        {/* alignmentForumAdmins see AF content above the fold */}
        { currentUser.groups?.includes('alignmentForumAdmins') && <div>
          <AFSuggestPostsList />
          <AFSuggestCommentsList />
          <AFSuggestUsersList />
        </div>}
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 7}} atBottom/>
      </div>}

      { userCanDo(currentUser, 'posts.moderate.all') && <div>
        {!!currentUser!.viewUnreviewedComments && <SunshineNewCommentsList terms={{view:"sunshineNewCommentsList"}}/>}
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

export default registerComponent("SunshineSidebar", SunshineSidebar, {
  styles,
  hocs: [withErrorBoundary]
});


