import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import PlusOneIcon from '@/lib/vendor/@material-ui/icons/src/PlusOne';
import UndoIcon from '@/lib/vendor/@material-ui/icons/src/Undo';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import withErrorBoundary from '../common/withErrorBoundary'
import { afSubmissionHeader, afSubmissionHeaderText } from "./AFSuggestPostsItem";
import SunshineListItem from "./SunshineListItem";
import SidebarHoverOver from "./SidebarHoverOver";
import { Typography } from "../common/Typography";
import ContentStyles from "../common/ContentStyles";
import SunshineSendMessageWithDefaults from "./SunshineSendMessageWithDefaults";
import CommentBody from "../comments/CommentsItem/CommentBody";
import SunshineCommentsItemOverview from "./SunshineCommentsItemOverview";
import SidebarInfo from "./SidebarInfo";
import SidebarActionMenu from "./SidebarActionMenu";
import SidebarAction from "./SidebarAction";
import OmegaIcon from "../icons/OmegaIcon";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { SetCommentSuggestedForAlignmentMutation } from '../alignment-forum/alignmentSuggestionMutations';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const ReviewCommentForAlignmentMutation = gql(`
  mutation reviewCommentForAlignment($commentId: String!, $approved: Boolean!) {
    reviewCommentForAlignment(commentId: $commentId, approved: $approved) {
      ...SuggestAlignmentComment
    }
  }
`);

const styles = defineStyles('AFSuggestCommentsItem', (theme: ThemeType) => ({
  afSubmissionHeader: {
    ...afSubmissionHeader(theme)
  },
  afSubmissionHeaderText: {
    ...afSubmissionHeaderText(theme)
  }
}))

const AFSuggestCommentsItem = ({comment}: {
  comment: SuggestAlignmentComment,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [setCommentSuggestedForAlignment] = useMutation(SetCommentSuggestedForAlignmentMutation);
  const [reviewCommentForAlignment] = useMutation(ReviewCommentForAlignmentMutation);

  const handleMoveToAlignment = async () => {
    await reviewCommentForAlignment({
      variables: { commentId: comment._id, approved: true }
    })
  }

  const handleDisregardForAlignment = () => {
    void reviewCommentForAlignment({
      variables: { commentId: comment._id, approved: false }
    })
  }
  
  const { hover, anchorEl, eventHandlers } = useHover();

  if (!currentUser) return null;

  const userHasVoted = comment.suggestForAlignmentUserIds && comment.suggestForAlignmentUserIds.includes(currentUser._id)
  const userHasSelfSuggested = comment.suggestForAlignmentUsers && comment.userId && comment.suggestForAlignmentUsers.map(user=>user._id).includes(comment.userId)

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
            <SidebarAction title="Unendorse for Alignment" onClick={() => (
              setCommentSuggestedForAlignment({
                variables: { commentId: comment._id, suggested: false }
              })
            )}>
              <UndoIcon/>
            </SidebarAction>
            :
            <SidebarAction title="Endorse for Alignment" onClick={() => (
              setCommentSuggestedForAlignment({
                variables: { commentId: comment._id, suggested: true }
              })
            )}>
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

export default registerComponent('AFSuggestCommentsItem', AFSuggestCommentsItem, {
  hocs: [withErrorBoundary]
});



