import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentSuggestForAlignment, commentUnSuggestForAlignment } from '../../lib/alignment-forum/comments/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import PlusOneIcon from '@/lib/vendor/@material-ui/icons/src/PlusOne';
import UndoIcon from '@/lib/vendor/@material-ui/icons/src/Undo';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import withErrorBoundary from '../common/withErrorBoundary'
import { defaultAFModeratorPMsTagSlug, afSubmissionHeader, afSubmissionHeaderText } from "./AFSuggestPostsItem";


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
  const userHasSelfSuggested = comment.suggestForAlignmentUsers && comment.userId && comment.suggestForAlignmentUsers.map(user=>user._id).includes(comment.userId)

  return (
    <span {...eventHandlers}>
      <Components.SunshineListItem hover={hover}>
        <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Components.Typography variant="body2">
            { userHasSelfSuggested && <div>
              <Components.ContentStyles contentType="comment" className={classes.afSubmissionHeaderText}>
                AF Submission
              </Components.ContentStyles>
              <Components.SunshineSendMessageWithDefaults user={comment.user} />
            </div>}
            {comment.post && <Link to={postGetPageUrl(comment.post) + "#" + comment._id}>
              Commented on post: <strong>{ comment.post.title }</strong>
            </Link>}
            <Components.CommentBody comment={comment}/>
          </Components.Typography>
        </Components.SidebarHoverOver>
        <Components.SunshineCommentsItemOverview comment={comment}/>
        <Components.SidebarInfo>
          Endorsed by { comment.suggestForAlignmentUsers && comment.suggestForAlignmentUsers.map(user=>user.displayName).join(", ") }
        </Components.SidebarInfo>
        { hover && <Components.SidebarActionMenu>
          { userHasVoted ?
            <Components.SidebarAction title="Unendorse for Alignment" onClick={()=>commentUnSuggestForAlignment({currentUser, comment, updateComment})}>
              <UndoIcon/>
            </Components.SidebarAction>
            :
            <Components.SidebarAction title="Endorse for Alignment" onClick={()=>commentSuggestForAlignment({currentUser, comment, updateComment})}>
              <PlusOneIcon/>
            </Components.SidebarAction>
          }
          <Components.SidebarAction title="Move to Alignment" onClick={handleMoveToAlignment}>
            <Components.OmegaIcon/>
          </Components.SidebarAction>
          <Components.SidebarAction title="Remove from Alignment Suggestions" onClick={handleDisregardForAlignment}>
            <ClearIcon/>
          </Components.SidebarAction>
        </Components.SidebarActionMenu>}
      </Components.SunshineListItem>
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

