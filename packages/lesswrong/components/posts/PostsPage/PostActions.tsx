import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useNamedMutation } from '../../../lib/crud/withMutation';
import { userCanDo, userIsPodcaster } from '../../../lib/vulcan-users/permissions';
import { userGetDisplayName, userIsSharedOn } from '../../../lib/collections/users/helpers'
import { userCanMakeAlignmentPost } from '../../../lib/alignment-forum/users/helpers'
import { useCurrentUser } from '../../common/withUser'
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import { useSetAlignmentPost } from "../../alignment-forum/withSetAlignmentPost";
import { useItemsRead } from '../../hooks/useRecordPostView';
import { Link } from '../../../lib/reactRouterWrapper';
import Tooltip from '@material-ui/core/Tooltip';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import EditIcon from '@material-ui/icons/Edit'
import GraphIcon from '@material-ui/icons/ShowChart'
import LocalOfferOutlinedIcon from '@material-ui/icons/LocalOfferOutlined'
import WarningIcon from '@material-ui/icons/Warning'
import qs from 'qs'
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'
import { useDialog } from '../../common/withDialog';
import { forumTypeSetting, taggingNamePluralCapitalSetting } from '../../../lib/instanceSettings';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { userHasAutosummarize } from '../../../lib/betas';

// We use a context here vs. passing in a boolean prop because we'd need to pass through ~4 layers of hierarchy
export const AllowHidingFrontPagePostsContext = React.createContext<boolean>(false)

const NotFPSubmittedWarning = ({className}: {className?: string}) => <div className={className}>
  {' '}<WarningIcon fontSize='inherit' />
</div>

const styles = (theme: ThemeType): JssStyles => ({
  actions: {
    minWidth: 300,
  },
  root: { //FIXME orphaned styles
    margin: 0,
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '2.5rem',
      marginBottom: 10,
      maxWidth: '80%'
    }
  },
  promoteWarning: {
    fontSize: 20,
    marginLeft: 4,
  }
})

const PostActions = ({post, closeMenu, classes}: {
  post: PostsList|SunshinePostsList,
  closeMenu: ()=>void,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const {postsRead, setPostRead} = useItemsRead();
  const {openDialog} = useDialog();
  const allowHidingPosts = React.useContext(AllowHidingFrontPagePostsContext)
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  const {setAlignmentPostMutation} = useSetAlignmentPost({fragmentName: "PostsList"});
  const {mutate: markAsReadOrUnread} = useNamedMutation<{
    postId: string, isRead: boolean,
  }>({
    name: 'markAsReadOrUnread',
    graphqlArgs: {postId: 'String', isRead: 'Boolean'},
  });
  
  const handleMarkAsRead = () => {
    void markAsReadOrUnread({
      postId: post._id,
      isRead: true,
    });
    setPostRead(post._id, true);
  }

  const handleMarkAsUnread = () => {
    void markAsReadOrUnread({
      postId: post._id,
      isRead: false,
    });
    setPostRead(post._id, false);
  }

  const handleMoveToMeta = () => {
    if (!currentUser) throw new Error("Cannot move to meta anonymously")
    void updatePost({
      selector: { _id: post._id},
      data: {
        meta: true,
        draft: false,
        metaDate: new Date(),
        frontpageDate: null,
        curatedDate: null,
        reviewedByUserId: currentUser._id,
      },
    })
  }

  const handleMoveToFrontpage = () => {
    if (!currentUser) throw new Error("Cannot move to frontpage anonymously")
    void updatePost({
      selector: { _id: post._id},
      data: {
        frontpageDate: new Date(),
        meta: false,
        draft: false,
        reviewedByUserId: currentUser._id,
      },
    })
  }

  const handleMoveToPersonalBlog = () => {
    if (!currentUser) throw new Error("Cannot move to personal blog anonymously")
    void updatePost({
      selector: { _id: post._id},
      data: {
        draft: false,
        meta: false,
        frontpageDate: null,
        reviewedByUserId: currentUser._id,
      },
    })
  }

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
    MoveToDraft, BookmarkButton, SuggestCuratedDropdownItem, SuggestAlignment,
    ReportPostMenuItem, DeleteDraft, NotifyMeButton, HideFrontPagePostButton,
    SetSideCommentVisibility, MenuItem,
  } = Components
  if (!post) return null;
  const postAuthor = post.user;

  const isRead = (post._id in postsRead) ? postsRead[post._id] : post.isRead;
  
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

  const defaultLabel = forumSelect({
    EAForum:'This post may appear on the Frontpage',
    default: 'Moderators may promote to Frontpage'
  })

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
        
        {userHasAutosummarize(currentUser)
          && <Components.PostSummaryAction closeMenu={closeMenu} post={post}/>}
        
        { isRead
          ? <div onClick={handleMarkAsUnread}>
              <MenuItem>
                Mark as Unread
              </MenuItem>
            </div>
          : <div onClick={handleMarkAsRead}>
              <MenuItem>
                Mark as Read
              </MenuItem>
            </div>
        }
        <SuggestCuratedDropdownItem post={post} />
        <MoveToDraft post={post}/>
        <DeleteDraft post={post}/>
        { userCanDo(currentUser, "posts.edit.all") &&
          <span>
            { !post.frontpageDate &&
              <div onClick={handleMoveToFrontpage}>
                <Tooltip placement="left" title={
                  post.submitToFrontpage ?
                    '' :
                    `user did not select ${defaultLabel} option`
                }>
                  <MenuItem>
                    Move to Frontpage
                    {!post.submitToFrontpage && <NotFPSubmittedWarning className={classes.promoteWarning} />}
                  </MenuItem>
                </Tooltip>
              </div>
            }
            { (post.frontpageDate || post.meta || post.curatedDate) &&
               <div onClick={handleMoveToPersonalBlog}>
                 <MenuItem>
                   Move to Personal Blog
                 </MenuItem>
               </div>
            }

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
