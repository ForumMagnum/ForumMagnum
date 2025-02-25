import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { postSuggestForAlignment, postUnSuggestForAlignment } from '../../lib/alignment-forum/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import PlusOneIcon from '@material-ui/icons/PlusOne';
import UndoIcon from '@material-ui/icons/Undo';
import ClearIcon from '@material-ui/icons/Clear';
import withErrorBoundary from '../common/withErrorBoundary'
import {DatabasePublicSetting} from "../../lib/publicSettings";
import { useUpdate } from '../../lib/crud/withUpdate';

export const defaultAFModeratorPMsTagSlug = new DatabasePublicSetting<string>('defaultAFModeratorPMsTagSlug', "af-default-moderator-responses")

export const afSubmissionHeader = (theme: ThemeType) => ({
  marginBottom: 24,
  display: "flex",
  flex: "flex-start",
  alignContent: "center",
  justifyContent: "space-between"
})

export const afSubmissionHeaderText = (theme: ThemeType) => ({
  fontStyle: 'italic',
})

const styles = (theme: ThemeType) => ({
  afSubmissionHeader: {
    ...afSubmissionHeader(theme)
  },
  afSubmissionHeaderText: {
    ...afSubmissionHeaderText(theme)
  }
})


const AFSuggestPostsItem = ({post, classes}: {
  post: SuggestAlignmentPost,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const { hover, anchorEl, eventHandlers } = useHover();
  
  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
  });

  const handleMoveToAlignment = () => {
    void updatePost({
      selector: {_id: post._id},
      data: {
        reviewForAlignmentUserId: currentUser!._id,
        afDate: new Date(),
        af: true,
      }
    })
  }

  const handleDisregardForAlignment = () => {
    void updatePost({
      selector: {_id: post._id},
      data: {
        reviewForAlignmentUserId: currentUser!._id,
      }
    })
  }

  if (!currentUser) return null;

  const userHasVoted = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)
  const userHasSelfSuggested = post.suggestForAlignmentUsers && post.suggestForAlignmentUsers.map(user=>user._id).includes(post.userId)

  return (
    <span {...eventHandlers}>
      <Components.SunshineListItem hover={hover}>
        <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          { userHasSelfSuggested && <Components.ContentStyles contentType="comment" className={classes.afSubmissionHeader}>
            <Components.ContentStyles contentType="comment" className={classes.afSubmissionHeaderText}>
              AF Submission
            </Components.ContentStyles>
            <Components.SunshineSendMessageWithDefaults user={post.user}/>
          </Components.ContentStyles>}
          <Components.Typography variant="title">
            <Link to={postGetPageUrl(post)}>
              { post.title }
            </Link>
          </Components.Typography>
          <br/>
          <Components.PostsHighlight post={post} maxLengthWords={600}/>
        </Components.SidebarHoverOver>
        <Link to={postGetPageUrl(post)}
          className="sunshine-sidebar-posts-title">
            {post.title}
        </Link>
        <div>
          <Components.SidebarInfo>
            { post.baseScore }
          </Components.SidebarInfo>
          <Components.SidebarInfo>
            <Link to={userGetProfileUrl(post.user)}>
                {post.user && post.user.displayName}
            </Link>
          </Components.SidebarInfo>
          {post.postedAt && <Components.SidebarInfo>
            <Components.FormatDate date={post.postedAt}/>
          </Components.SidebarInfo>}
        </div>
        <Components.SidebarInfo>
          Endorsed by { post.suggestForAlignmentUsers && post.suggestForAlignmentUsers.map(user=>user.displayName).join(", ") }
        </Components.SidebarInfo>
        { hover && <Components.SidebarActionMenu>
          { userHasVoted ?
            <Components.SidebarAction title="Unendorse for Alignment" onClick={()=>postUnSuggestForAlignment({currentUser, post, updatePost})}>
              <UndoIcon/>
            </Components.SidebarAction>
            :
            <Components.SidebarAction title="Endorse for Alignment" onClick={()=>postSuggestForAlignment({currentUser, post, updatePost})}>
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

const AFSuggestPostsItemComponent = registerComponent('AFSuggestPostsItem', AFSuggestPostsItem, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    AFSuggestPostsItem: typeof AFSuggestPostsItemComponent
  }
}
