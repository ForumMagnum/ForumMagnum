import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import PlusOneIcon from '@material-ui/icons/PlusOne';
import UndoIcon from '@material-ui/icons/Undo';
import StarIcon from '@material-ui/icons/Star';
import ClearIcon from '@material-ui/icons/Clear';
import * as _ from 'underscore';

interface ExternalProps {
  post: PostsList,
}
interface SunshineCuratedSuggestionsItemProps extends ExternalProps, WithUserProps, WithHoverProps {
  updatePost: any,
}

class SunshineCuratedSuggestionsItem extends Component<SunshineCuratedSuggestionsItemProps> {
  handleCurate = () => {
    const { currentUser, post, updatePost } = this.props
    updatePost({
      selector: {_id: post._id},
      data: {
        reviewForCuratedUserId: currentUser!._id,
        curatedDate: new Date(),
      }
    })
  }

  handleDisregardForCurated = () => {
    const { currentUser, post, updatePost } = this.props
    updatePost({
      selector: {_id: post._id},
      data: {
        reviewForCuratedUserId: currentUser!._id,
      }
    })
  }

  handleSuggestCurated = () => {
    const { currentUser, post, updatePost } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser!._id)) {
      suggestUserIds.push(currentUser!._id)
    }
    updatePost({
      selector: {_id: post._id},
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  handleUnsuggestCurated = () => {
    const { currentUser, post, updatePost } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser!._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser!._id);
    }
    updatePost({
      selector: {_id: post._id},
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  render () {
    const { post, currentUser, hover, anchorEl } = this.props
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
          Endorsed by { post.suggestForCuratedUsernames }
        </Components.SidebarInfo>
        { hover && <Components.SidebarActionMenu>
          { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser!._id) ?
            <Components.SidebarAction title="Endorse Curation" onClick={this.handleSuggestCurated}>
              <PlusOneIcon/>
            </Components.SidebarAction>
            :
            <Components.SidebarAction title="Unendorse Curation" onClick={this.handleUnsuggestCurated}>
              <UndoIcon/>
            </Components.SidebarAction>
          }
          <Components.SidebarAction title="Curate Post" onClick={this.handleCurate}>
            <StarIcon/>
          </Components.SidebarAction>
          <Components.SidebarAction title="Remove from Curation Suggestions" onClick={this.handleDisregardForCurated}>
            <ClearIcon/>
          </Components.SidebarAction>
        </Components.SidebarActionMenu>}
      </Components.SunshineListItem>
    )
  }
}

const SunshineCuratedSuggestionsItemComponent = registerComponent<ExternalProps>('SunshineCuratedSuggestionsItem', SunshineCuratedSuggestionsItem, {
  hocs: [
    withUpdate({
      collectionName: "Posts",
      fragmentName: 'PostsList',
    }),
    withUser,
    withHover(),
    withErrorBoundary
  ]
});

declare global {
  interface ComponentTypes {
    SunshineCuratedSuggestionsItem: typeof SunshineCuratedSuggestionsItemComponent
  }
}
