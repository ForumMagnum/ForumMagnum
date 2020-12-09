import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { postSuggestForAlignment, postUnSuggestForAlignment } from '../../lib/alignment-forum/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import PlusOneIcon from '@material-ui/icons/PlusOne';
import UndoIcon from '@material-ui/icons/Undo';
import ClearIcon from '@material-ui/icons/Clear';
import withErrorBoundary from '../common/withErrorBoundary'

interface ExternalProps {
  post: SuggestAlignmentPost,
}
interface AFSuggestPostsItemProps extends ExternalProps, WithUserProps, WithHoverProps {
  updatePost: WithUpdateFunction<PostsCollection>,
}

class AFSuggestPostsItem extends Component<AFSuggestPostsItemProps> {

  handleMoveToAlignment = () => {
    const { currentUser, post, updatePost } = this.props
    void updatePost({
      selector: {_id: post._id},
      data: {
        reviewForAlignmentUserId: currentUser!._id,
        afDate: new Date(),
        af: true,
      }
    })
  }

  handleDisregardForAlignment = () => {
    const { currentUser, post, updatePost } = this.props
    void updatePost({
      selector: {_id: post._id},
      data: {
        reviewForAlignmentUserId: currentUser!._id,
      }
    })
  }

  render () {
    const { post, currentUser, hover, anchorEl, updatePost } = this.props
    
    if (!currentUser) return null;

    const userHasVoted = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)

    return (
      <Components.SunshineListItem hover={hover}>
        <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl} >
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

const AFSuggestPostsItemComponent = registerComponent<ExternalProps>('AFSuggestPostsItem', AFSuggestPostsItem, {
  hocs: [
    withUpdate({
      collectionName: "Posts",
      fragmentName: 'SuggestAlignmentPost',
    }),
    withUser,
    withHover(),
    withErrorBoundary
  ]
});

declare global {
  interface ComponentTypes {
    AFSuggestPostsItem: typeof AFSuggestPostsItemComponent
  }
}

