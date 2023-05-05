import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { userCanDo, userIsPodcaster } from '../../../lib/vulcan-users/permissions';
import { userGetDisplayName, userIsSharedOn } from '../../../lib/collections/users/helpers'
import { userCanMakeAlignmentPost } from '../../../lib/alignment-forum/users/helpers'
import { useCurrentUser } from '../../common/withUser'
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import { useSetAlignmentPost } from "../../alignment-forum/withSetAlignmentPost";
import { Link } from '../../../lib/reactRouterWrapper';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import EditIcon from '@material-ui/icons/Edit'
import GraphIcon from '@material-ui/icons/ShowChart'
import LocalOfferOutlinedIcon from '@material-ui/icons/LocalOfferOutlined'
import qs from 'qs'
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'
import { useDialog } from '../../common/withDialog';
import { forumTypeSetting, taggingNamePluralCapitalSetting } from '../../../lib/instanceSettings';

// We use a context here vs. passing in a boolean prop because we'd need to pass through ~4 layers of hierarchy
export const AllowHidingFrontPagePostsContext = React.createContext<boolean>(false)

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
  const {openDialog} = useDialog();
  const allowHidingPosts = React.useContext(AllowHidingFrontPagePostsContext)
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  const {setAlignmentPostMutation} = useSetAlignmentPost({fragmentName: "PostsList"});

  const handleMakeShortform = () => {
    void updateUser({
      selector: { _id: post.userId },
      data: {
        shortformFeedId: post._id
      },
    });
  }

  const handleMoveToAlignmentForum = () => {
    void setAlignmentPostMutation({
      postId: post._id,
      af: true,
    })
  }

  const handleRemoveFromAlignmentForum = () => {
    void setAlignmentPostMutation({
      postId: post._id,
      af: false,
    })
  }

  // TODO refactor this so it shares code with ModeratorActions and doens't get out of sync
  const handleApproveUser = async () => {
    await updateUser({
      selector: {_id: post.userId},
      data: {
        reviewedByUserId: currentUser?._id, 
        sunshineFlagged: false,
        reviewedAt: new Date(),
        needsReview: false,
        snoozedUntilContentCount: null
      }
    })
  }

  const handleOpenTagDialog = async () => {
    openDialog({
      componentName: "EditTagsDialog",
      componentProps: {
        post
      }
    });
    closeMenu();
  }

  const {
    MoveToDraftDropdownItem, BookmarkButton, SuggestCuratedDropdownItem,
    SuggestAlignment, ReportPostMenuItem, DeleteDraftDropdownItem, NotifyMeButton,
    HideFrontPagePostButton, SetSideCommentVisibility, MenuItem,
    MarkAsReadDropdownItem, SummarizeDropdownItem, MoveToFrontpageDropdownItem,
  } = Components;

  if (!post) return null;
  const postAuthor = post.user;

  let editLink: React.ReactNode|null = null;
  const isEditor = canUserEditPostMetadata(currentUser,post);
  const isPodcaster = userIsPodcaster(currentUser);
  const isShared = userIsSharedOn(currentUser, post);
  if (isEditor || isPodcaster || isShared) {
    const link = (isEditor || isPodcaster) ? {pathname:'/editPost', search:`?${qs.stringify({postId: post._id, eventForm: post.isEvent})}`} : {pathname:'/collaborateOnPost', search:`?${qs.stringify({postId: post._id})}`}
    editLink = <Link to={link}>
      <MenuItem>
        <ListItemIcon>
          <EditIcon />
        </ListItemIcon>
        Edit
      </MenuItem>
    </Link>
  }

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
        {editLink}
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

        <BookmarkButton post={post} menuItem/>
        <SetSideCommentVisibility />
        
        {allowHidingPosts && <HideFrontPagePostButton post={post} />}

        <ReportPostMenuItem post={post}/>
        <div onClick={handleOpenTagDialog}>
          <MenuItem>
            <ListItemIcon>
              <LocalOfferOutlinedIcon />
            </ListItemIcon>
            Edit {taggingNamePluralCapitalSetting.get()}
          </MenuItem>
        </div>

        <SummarizeDropdownItem post={post} closeMenu={closeMenu} />
        <MarkAsReadDropdownItem post={post} />
        <SuggestCuratedDropdownItem post={post} />
        <MoveToDraftDropdownItem post={post} />
        <DeleteDraftDropdownItem post={post} />
        <MoveToFrontpageDropdownItem post={post} />

        { userCanDo(currentUser, "posts.edit.all") &&
          <span>
            { !post.shortform &&
               <div onClick={handleMakeShortform}>
                 <MenuItem>
                   Set as user's Shortform Post
                 </MenuItem>
               </div>
            }

            { post.authorIsUnreviewed &&
               <div onClick={handleApproveUser}>
                 <MenuItem>
                   Approve New User
                 </MenuItem>
               </div>
            }
          </span>
        }
        {forumTypeSetting.get() !== "EAForum" && <>
          <SuggestAlignment post={post}/>
          { userCanMakeAlignmentPost(currentUser, post) && !post.af && 
            <div onClick={handleMoveToAlignmentForum }>
              <MenuItem>
                Ω Move to Alignment
              </MenuItem>
            </div>
          }
          { userCanMakeAlignmentPost(currentUser, post) && post.af &&
            <div onClick={handleRemoveFromAlignmentForum}>
              <MenuItem>
                Ω Remove Alignment
              </MenuItem>
            </div>
          }
        </>}
      </div>
  )
}

const PostActionsComponent = registerComponent('PostActions', PostActions, {styles});

declare global {
  interface ComponentTypes {
    PostActions: typeof PostActionsComponent
  }
}
