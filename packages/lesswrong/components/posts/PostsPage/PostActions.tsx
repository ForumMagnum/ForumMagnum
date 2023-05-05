import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { userGetDisplayName } from '../../../lib/collections/users/helpers'
import { useCurrentUser } from '../../common/withUser'
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import { Link } from '../../../lib/reactRouterWrapper';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import EditIcon from '@material-ui/icons/Edit'
import GraphIcon from '@material-ui/icons/ShowChart'
import qs from 'qs'
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'
import { forumTypeSetting } from '../../../lib/instanceSettings';

// We use a context here vs. passing in a boolean prop because we'd need to pass
// through ~4 layers of hierarchy
export const AllowHidingFrontPagePostsContext = React.createContext<boolean>(false);

const styles = (_theme: ThemeType): JssStyles => ({
  actions: {
    minWidth: 300,
  },
})

const PostActions = ({post, closeMenu, classes}: {
  post: PostsList|SunshinePostsList,
  closeMenu: ()=>void,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();

  const {
    MoveToDraftDropdownItem, BookmarkDropdownItem, SuggestCuratedDropdownItem,
    SuggestAlignmentPostDropdownItem, ReportPostDropdownItem, DeleteDraftDropdownItem,
    NotifyMeButton, HideFrontpagePostDropdownItem, SetSideCommentVisibility, MenuItem,
    MarkAsReadDropdownItem, SummarizeDropdownItem, MoveToFrontpageDropdownItem,
    MoveToAlignmentDropdownItem, ShortformDropdownItem, ApproveNewUserDropdownItem,
    EditTagsDropdownItem, EditPostDropdownItem,
  } = Components;

  if (!post) return null;
  const postAuthor = post.user;

  // WARNING: Clickable items in this menu must be full-width, and
  // ideally should use the <MenuItem> component. In particular,
  // do NOT wrap a <MenuItem> around something that has its own
  // onClick handler; the onClick handler should either be on the
  // MenuItem, or on something outside of it. Putting an onClick
  // on an element inside of a MenuItem can create a dead-space
  // click area to the right of the item which looks like you've
  // selected the thing, and closes the menu, but doesn't do the
  // thing.

  return (
      <div className={classes.actions} >
        <EditPostDropdownItem post={post} />
        { canUserEditPostMetadata(currentUser,post) && post.isEvent && <Link to={{pathname:'/newPost', search:`?${qs.stringify({eventForm: post.isEvent, templateId: post._id})}`}}>
          <MenuItem>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            Duplicate Event
          </MenuItem>
        </Link>}
        { forumTypeSetting.get() === 'EAForum' && canUserEditPostMetadata(currentUser, post) && <Link
          to={{pathname: '/postAnalytics', search: `?${qs.stringify({postId: post._id})}`}}
        >
          <MenuItem>
            <ListItemIcon>
              <GraphIcon />
            </ListItemIcon>
            Analytics
          </MenuItem>
        </Link>}
        {currentUser && post.group &&
          <NotifyMeButton asMenuItem
            document={post.group} showIcon
            subscribeMessage={"Subscribe to "+post.group.name}
            unsubscribeMessage={"Unsubscribe from "+post.group.name}
          />
        }

        {currentUser && post.shortform && (post.userId !== currentUser._id) &&
          <NotifyMeButton asMenuItem document={post} showIcon
            subscriptionType={subscriptionTypes.newShortform}
            subscribeMessage={`Subscribe to ${post.title}`}
            unsubscribeMessage={`Unsubscribe from ${post.title}`}
          />
        }

        {currentUser && postAuthor && postAuthor._id !== currentUser._id &&
          <NotifyMeButton asMenuItem document={postAuthor} showIcon
            subscribeMessage={"Subscribe to posts by "+userGetDisplayName(postAuthor)}
            unsubscribeMessage={"Unsubscribe from posts by "+userGetDisplayName(postAuthor)}
          />
        }

        {currentUser && post.debate &&
          <NotifyMeButton
            asMenuItem
            showIcon
            document={post}
            subscriptionType={subscriptionTypes.newDebateComments}
            subscribeMessage="Subscribe to dialogue"
            unsubscribeMessage="Unsubscribe from dialogue"
            tooltip="Notifies you when there is new activity in the dialogue"
          />
        }

        {currentUser && <NotifyMeButton asMenuItem
          document={post} showIcon
          subscribeMessage="Subscribe to comments"
          unsubscribeMessage="Unsubscribe from comments"
        />}

        <BookmarkDropdownItem post={post} />
        <SetSideCommentVisibility />
        <HideFrontpagePostDropdownItem post={post} />
        <ReportPostDropdownItem post={post}/>
        <EditTagsDropdownItem post={post} closeMenu={closeMenu} />
        <SummarizeDropdownItem post={post} closeMenu={closeMenu} />
        <MarkAsReadDropdownItem post={post} />
        <SuggestCuratedDropdownItem post={post} />
        <MoveToDraftDropdownItem post={post} />
        <DeleteDraftDropdownItem post={post} />
        <MoveToFrontpageDropdownItem post={post} />
        <ShortformDropdownItem post={post} />
        <ApproveNewUserDropdownItem post={post} />
        <SuggestAlignmentPostDropdownItem post={post}/>
        <MoveToAlignmentDropdownItem post={post}/>
      </div>
  )
}

const PostActionsComponent = registerComponent('PostActions', PostActions, {styles});

declare global {
  interface ComponentTypes {
    PostActions: typeof PostActionsComponent
  }
}
