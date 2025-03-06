import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentSuggestForAlignment, commentUnSuggestForAlignment } from '../../lib/alignment-forum/comments/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import PlusOneIcon from '@material-ui/icons/PlusOne';
import UndoIcon from '@material-ui/icons/Undo';
import ClearIcon from '@material-ui/icons/Clear';
import withErrorBoundary from '../common/withErrorBoundary'
import { defaultAFModeratorPMsTagSlug, afSubmissionHeader, afSubmissionHeaderText } from "./AFSuggestPostsItem";
import SunshineListItem from "@/components/sunshineDashboard/SunshineListItem";
import SidebarActionMenu from "@/components/sunshineDashboard/SidebarActionMenu";
import SidebarAction from "@/components/sunshineDashboard/SidebarAction";
import OmegaIcon from "@/components/icons/OmegaIcon";
import SidebarInfo from "@/components/sunshineDashboard/SidebarInfo";
import SunshineCommentsItemOverview from "@/components/sunshineDashboard/SunshineCommentsItemOverview";
import SidebarHoverOver from "@/components/sunshineDashboard/SidebarHoverOver";
import { Typography } from "@/components/common/Typography";
import CommentBody from "@/components/comments/CommentsItem/CommentBody";
import SunshineSendMessageWithDefaults from "@/components/sunshineDashboard/SunshineSendMessageWithDefaults";
import { ContentStyles } from "@/components/common/ContentStyles";

const styles = (theme: ThemeType) => ({
  afSubmissionHeader: {
    ...afSubmissionHeader(theme)
  },
  afSubmissionHeaderText: {
    ...afSubmissionHeaderText(theme)
  }
})

const AFSuggestCommentsItem = ({comment, classes}: {
  comment: SuggestAlignmentComment,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
  });

  const handleMoveToAlignment = async () => {
    await updateComment({
      selector: { _id: comment._id},
      data: {
        reviewForAlignmentUserId: currentUser!._id,
        afDate: new Date(),
        af: true,
      },
    })
  }

  const handleDisregardForAlignment = () => {
    void updateComment({
      selector: { _id: comment._id},
      data: {
        reviewForAlignmentUserId: currentUser!._id,
      }
    })
  }
  
  const { hover, anchorEl, eventHandlers } = useHover();

  if (!currentUser) return null;

  const userHasVoted = comment.suggestForAlignmentUserIds && comment.suggestForAlignmentUserIds.includes(currentUser._id)
  const userHasSelfSuggested = comment.suggestForAlignmentUsers && comment.suggestForAlignmentUsers.map(user=>user._id).includes(comment.userId)

  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Typography variant="body2">
            { userHasSelfSuggested && <div>
              <ContentStyles contentType="comment" className={classes.afSubmissionHeaderText}>
                AF Submission
              </ContentStyles>
              <SunshineSendMessageWithDefaults user={comment.user} />
            </div>}
            {comment.post && <Link to={postGetPageUrl(comment.post) + "#" + comment._id}>
              Commented on post: <strong>{ comment.post.title }</strong>
            </Link>}
            <CommentBody comment={comment}/>
          </Typography>
        </SidebarHoverOver>
        <SunshineCommentsItemOverview comment={comment}/>
        <SidebarInfo>
          Endorsed by { comment.suggestForAlignmentUsers && comment.suggestForAlignmentUsers.map(user=>user.displayName).join(", ") }
        </SidebarInfo>
        { hover && <SidebarActionMenu>
          { userHasVoted ?
            <SidebarAction title="Unendorse for Alignment" onClick={()=>commentUnSuggestForAlignment({currentUser, comment, updateComment})}>
              <UndoIcon/>
            </SidebarAction>
            :
            <SidebarAction title="Endorse for Alignment" onClick={()=>commentSuggestForAlignment({currentUser, comment, updateComment})}>
              <PlusOneIcon/>
            </SidebarAction>
          }
          <SidebarAction title="Move to Alignment" onClick={handleMoveToAlignment}>
            <OmegaIcon/>
          </SidebarAction>
          <SidebarAction title="Remove from Alignment Suggestions" onClick={handleDisregardForAlignment}>
            <ClearIcon/>
          </SidebarAction>
        </SidebarActionMenu>}
      </SunshineListItem>
    </span>
  );
}

const AFSuggestCommentsItemComponent = registerComponent('AFSuggestCommentsItem', AFSuggestCommentsItem, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    AFSuggestCommentsItem: typeof AFSuggestCommentsItemComponent
  }
}

export default AFSuggestCommentsItemComponent;

