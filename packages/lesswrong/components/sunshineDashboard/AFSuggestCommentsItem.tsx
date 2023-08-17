import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentSuggestForAlignment, commentUnSuggestForAlignment } from '../../lib/alignment-forum/comments/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import PlusOneIcon from '@material-ui/icons/PlusOne';
import UndoIcon from '@material-ui/icons/Undo';
import ClearIcon from '@material-ui/icons/Clear';
import withErrorBoundary from '../common/withErrorBoundary'
import { defaultAFModeratorPMsTagSlug, afSubmissionHeader, afSubmissionHeaderText } from "./AFSuggestPostsItem";


const styles = (theme: ThemeType): JssStyles => ({
  afSubmissionHeader: {
    ...afSubmissionHeader(theme)
  },
  afSubmissionHeaderText: {
    ...afSubmissionHeaderText(theme)
  }
})

interface ExternalProps {
  comment: SuggestAlignmentComment,
}
interface AFSuggestCommentsItemProps extends ExternalProps, WithUserProps, WithHoverProps, WithStylesProps {
  updateComment: WithUpdateFunction<CommentsCollection>,
}



class AFSuggestCommentsItem extends Component<AFSuggestCommentsItemProps> {

  handleMoveToAlignment = async () => {
    const { currentUser, comment, updateComment } = this.props
    await updateComment({
      selector: { _id: comment._id},
      data: {
        reviewForAlignmentUserId: currentUser!._id,
        afDate: new Date(),
        af: true,
      },
    })
  }

  handleDisregardForAlignment = () => {
    const { currentUser, comment, updateComment } = this.props
    void updateComment({
      selector: { _id: comment._id},
      data: {
        reviewForAlignmentUserId: currentUser!._id,
      }
    })
  }

  render () {
    const { classes, comment, currentUser, hover, anchorEl, updateComment } = this.props
    if (!currentUser) return null;

    const userHasVoted = comment.suggestForAlignmentUserIds && comment.suggestForAlignmentUserIds.includes(currentUser._id)
    const userHasSelfSuggested = comment.suggestForAlignmentUsers && comment.suggestForAlignmentUsers.map(user=>user._id).includes(comment.userId)

    return (
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
          <Components.SidebarAction title="Move to Alignment" onClick={this.handleMoveToAlignment}>
            <Components.OmegaIcon/>
          </Components.SidebarAction>
          <Components.SidebarAction title="Remove from Alignment Suggestions" onClick={this.handleDisregardForAlignment}>
            <ClearIcon/>
          </Components.SidebarAction>
        </Components.SidebarActionMenu>}
      </Components.SunshineListItem>
    )
  }
}

const AFSuggestCommentsItemComponent = registerComponent<ExternalProps>('AFSuggestCommentsItem', AFSuggestCommentsItem, {
  styles,
  hocs: [
    withUpdate({
      collectionName: "Comments",
      fragmentName: 'SuggestAlignmentComment',
    }),
    withUser,
    withHover(),
    withErrorBoundary
  ]
});

declare global {
  interface ComponentTypes {
    AFSuggestCommentsItem: typeof AFSuggestCommentsItemComponent
  }
}

