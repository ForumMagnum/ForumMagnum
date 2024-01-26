import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import PlusOneIcon from '@material-ui/icons/PlusOne';
import UndoIcon from '@material-ui/icons/Undo';
import ClearIcon from '@material-ui/icons/Clear';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  audioIcon: {
    width: 14,
    height: 14,
    color: theme.palette.grey[500],
    position: "relative",
    top: 2
  }
});


const SunshineCuratedSuggestionsItem = ({classes, post}: {
  classes: ClassesType,
  post: PostsList
}) => {
  const currentUser = useCurrentUser();
  const { hover, anchorEl, eventHandlers } = useHover();
  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  const handleCurate = () => {
    void updatePost({
      selector: {_id: post._id},
      data: {
        reviewForCuratedUserId: currentUser!._id,
        curatedDate: new Date(),
      }
    })
  }

  const handleDisregardForCurated = () => {
    void updatePost({
      selector: {_id: post._id},
      data: {
        reviewForCuratedUserId: currentUser!._id,
      }
    })
  }

  const handleSuggestCurated = () => {
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser!._id)) {
      suggestUserIds.push(currentUser!._id)
    }
    void updatePost({
      selector: {_id: post._id},
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  const handleUnsuggestCurated = () => {
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser!._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser!._id);
    }
    void updatePost({
      selector: {_id: post._id},
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  return (
    <span {...eventHandlers}>
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
          {post.podcastEpisodeId &&
            <Components.ForumIcon icon="VolumeUp" className={classes.audioIcon} />
          }
        </div>
        <Components.SidebarInfo>
          Endorsed by { post.suggestForCuratedUsernames }
        </Components.SidebarInfo>
        { hover && <Components.SidebarActionMenu>
          { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser!._id) ?
            <Components.SidebarAction title="Endorse Curation" onClick={handleSuggestCurated}>
              <PlusOneIcon/>
            </Components.SidebarAction>
            :
            <Components.SidebarAction title="Unendorse Curation" onClick={handleUnsuggestCurated}>
              <UndoIcon/>
            </Components.SidebarAction>
          }
          <Components.SidebarAction title="Curate Post" onClick={handleCurate}>
            <Components.ForumIcon icon="Star" />
          </Components.SidebarAction>
          <Components.SidebarAction title="Remove from Curation Suggestions" onClick={handleDisregardForCurated}>
            <ClearIcon/>
          </Components.SidebarAction>
        </Components.SidebarActionMenu>}
      </Components.SunshineListItem>
    </span>
  )
}

const SunshineCuratedSuggestionsItemComponent = registerComponent('SunshineCuratedSuggestionsItem', SunshineCuratedSuggestionsItem, {styles, 
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineCuratedSuggestionsItem: typeof SunshineCuratedSuggestionsItemComponent
  }
}
