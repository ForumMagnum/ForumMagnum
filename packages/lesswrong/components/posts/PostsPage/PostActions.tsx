import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useNamedMutation } from '../../../lib/crud/withMutation';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { userGetDisplayName, userCanCollaborate } from '../../../lib/collections/users/helpers'
import { userCanMakeAlignmentPost } from '../../../lib/alignment-forum/users/helpers'
import { useCurrentUser } from '../../common/withUser'
import { postCanEdit } from '../../../lib/collections/posts/helpers';
import { useSetAlignmentPost } from "../../alignment-forum/withSetAlignmentPost";
import { useItemsRead } from '../../common/withRecordPostView';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper';
import Tooltip from '@material-ui/core/Tooltip';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import EditIcon from '@material-ui/icons/Edit'
import LocalOfferOutlinedIcon from '@material-ui/icons/LocalOfferOutlined'
import WarningIcon from '@material-ui/icons/Warning'
import qs from 'qs'
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'
import { useDialog } from '../../common/withDialog';

const NotFPSubmittedWarning = ({className}: {className?: string}) => <div className={className}>
  {' '}<WarningIcon fontSize='inherit' />
</div>

const styles = (theme: ThemeType): JssStyles => ({
  root: {
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
  post: PostsList,
  closeMenu: ()=>void
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser();
  const {postsRead, setPostRead} = useItemsRead();
  const {openDialog} = useDialog();
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

  const handleApproveUser = async () => {
    await updateUser({
      selector: {_id: post.userId},
      data: {reviewedByUserId: currentUser?._id}
    })
  }

  const handleOpenTagDialog = async () => {
    openDialog({
      componentName: "EditTagsDialog",
      componentProps: {
        post
      }
    });
  }

  const { MoveToDraft, BookmarkButton, SuggestCurated, SuggestAlignment, ReportPostMenuItem, DeleteDraft, SubscribeTo, NominatePostMenuItem } = Components
  if (!post) return null;
  const postAuthor = post.user;

  const isRead = (post._id in postsRead) ? postsRead[post._id] : post.isRead;

  return (
      <div className={classes.actions}>
        {/* <NominatePostMenuItem post={post} closeMenu={closeMenu} /> */}
        { postCanEdit(currentUser,post) && <Link to={{pathname:'/editPost', search:`?${qs.stringify({postId: post._id, eventForm: post.isEvent})}`}}>
          <MenuItem>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            Edit
          </MenuItem>
        </Link>}
        { userCanCollaborate(currentUser, post) &&
          <Link to={{pathname:'/collaborateOnPost', search:`?${qs.stringify({postId: post._id})}`}}>
            <MenuItem>
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              Collaborative Editing
            </MenuItem>
          </Link>
        }
        {currentUser && post.group && <MenuItem>
          <SubscribeTo document={post.group} showIcon
            subscribeMessage={"Subscribe to "+post.group.name}
            unsubscribeMessage={"Unsubscribe from "+post.group.name}/>
        </MenuItem>}

        {currentUser && post.shortform && (post.userId !== currentUser._id) &&
          <MenuItem>
            <SubscribeTo document={post} showIcon
              subscriptionType={subscriptionTypes.newShortform}
              subscribeMessage={`Subscribe to ${post.title}`}
              unsubscribeMessage={`Unsubscribe from ${post.title}`}
            />
          </MenuItem>
        }

        {currentUser && postAuthor && postAuthor._id !== currentUser._id && <MenuItem>
          <SubscribeTo document={postAuthor} showIcon
            subscribeMessage={"Subscribe to posts by "+userGetDisplayName(postAuthor)}
            unsubscribeMessage={"Unsubscribe from posts by "+userGetDisplayName(postAuthor)}/>
        </MenuItem>}

        {currentUser && <MenuItem>
          <SubscribeTo document={post} showIcon
            subscribeMessage="Subscribe to comments"
            unsubscribeMessage="Unsubscribe from comments"/>
        </MenuItem>}

        <BookmarkButton post={post} menuItem/>

        <ReportPostMenuItem post={post}/>
        <div onClick={handleOpenTagDialog}>
          <MenuItem>
            <ListItemIcon>
              <LocalOfferOutlinedIcon />
            </ListItemIcon>
            Edit Tags
          </MenuItem>
        </div>
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
        <SuggestCurated post={post}/>
        <MoveToDraft post={post}/>
        <DeleteDraft post={post}/>
        { userCanDo(currentUser, "posts.edit.all") &&
          <span>
            { !post.meta &&
              <div onClick={handleMoveToMeta}>
                <MenuItem>
                  Move to Meta
                </MenuItem>
              </div>
            }
            { !post.frontpageDate &&
              <div onClick={handleMoveToFrontpage}>
                <Tooltip placement="left" title={
                  post.submitToFrontpage ?
                    '' :
                    'user did not select "Moderators may promote to Frontpage" option'
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
        <SuggestAlignment post={post}/>
        { userCanMakeAlignmentPost(currentUser, post) &&
          !post.af && <div onClick={handleMoveToAlignmentForum }>
            <MenuItem>
              Ω Move to Alignment
            </MenuItem>
          </div>}
        { userCanMakeAlignmentPost(currentUser, post) && post.af &&
          <div onClick={handleRemoveFromAlignmentForum}>
            <MenuItem>
              Ω Remove Alignment
            </MenuItem>
          </div>
        }
      </div>
  )
}

const PostActionsComponent = registerComponent('PostActions', PostActions, {styles});

declare global {
  interface ComponentTypes {
    PostActions: typeof PostActionsComponent
  }
}
