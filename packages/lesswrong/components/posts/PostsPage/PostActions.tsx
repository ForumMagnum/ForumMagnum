import React, {Component, useCallback} from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { withUpdate } from '../../../lib/crud/withUpdate';
import { withMutation } from '../../../lib/crud/withMutation';
import Users from '../../../lib/collections/users/collection'
import withUser from '../../common/withUser'
import { Posts } from '../../../lib/collections/posts';
import withSetAlignmentPost from "../../alignment-forum/withSetAlignmentPost";
import { withPostsRead, PostsReadContextType } from '../../common/withRecordPostView';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper';
import Tooltip from '@material-ui/core/Tooltip';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import EditIcon from '@material-ui/icons/Edit'
import WarningIcon from '@material-ui/icons/Warning'
import qs from 'qs'
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema'
import { withDialog } from '../../common/withDialog';
import { tagStyle } from '../../tagging/FooterTag';
import { forumTypeSetting } from '../../../lib/instanceSettings';

const metaName = forumTypeSetting.get() === 'EAForum' ? 'Community' : 'Meta'

const NotFPSubmittedWarning = ({className}) => <div className={className}>
  {' '}<WarningIcon fontSize='inherit' />
</div>

const styles = theme => ({
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
  },
  editTags: {
    ...tagStyle(theme)
  }
})

interface ExternalProps {
  post: PostsList,
}
interface PostActionsProps extends ExternalProps, WithUserProps, WithUpdateUserProps, WithUpdatePostProps, WithStylesProps, WithDialogProps, PostsReadContextType {
  markAsReadOrUnread: any,
  setAlignmentPostMutation: any,
}

class PostActions extends Component<PostActionsProps,{}> {

  handleMarkAsRead = () => {
    const {markAsReadOrUnread, post, setPostRead} = this.props;
    markAsReadOrUnread({
      postId: post._id,
      isRead: true,
    });
    setPostRead(post._id, true);
  }

  handleMarkAsUnread = () => {
    const {markAsReadOrUnread, post, setPostRead} = this.props;
    markAsReadOrUnread({
      postId: post._id,
      isRead: false,
    });
    setPostRead(post._id, false);
  }

  handleMoveToMeta = () => {
    const { post, updatePost } = this.props
    updatePost({
      selector: { _id: post._id},
      data: {
        meta: true,
        draft: false,
        metaDate: new Date(),
        frontpageDate: null,
        curatedDate: null
      },
    })
  }

  handleMoveToFrontpage = () => {
    const { post, updatePost } = this.props
    updatePost({
      selector: { _id: post._id},
      data: {
        frontpageDate: new Date(),
        meta: false,
        draft: false
      },
    })
  }

  handleMoveToPersonalBlog = () => {
    const { post, updatePost } = this.props
    updatePost({
      selector: { _id: post._id},
      data: {
        draft: false,
        meta: false,
        frontpageDate: null
      },
    })
  }

  handleMakeShortform = () => {
    const { post, updateUser } = this.props;
    updateUser({
      selector: { _id: post.userId },
      data: {
        shortformFeedId: post._id
      },
    });
  }

  handleMoveToAlignmentForum = () => {
    const { post, setAlignmentPostMutation } = this.props
    setAlignmentPostMutation({
      postId: post._id,
      af: true,
    })
  }

  handleRemoveFromAlignmentForum = () => {
    const { post, setAlignmentPostMutation } = this.props
    setAlignmentPostMutation({
      postId: post._id,
      af: false,
    })
  }

  handleApproveUser = async () => {
    const { currentUser, post, updateUser } = this.props
    await updateUser({
      selector: {_id: post.userId},
      data: {reviewedByUserId: currentUser?._id}
    })
  }

  handleAddTag = async ({tagId, tagName}: {tagId:string, tagName: string}) => {
    const { post, mutate } = this.props
    await mutate({
      variables: {
        tagId: tagId,
        postId: post._id
    },
  });

  }

  handleAddTag = useCallback(async ({tagId, tagName}: {tagId: string, tagName: string}) => {
    setIsAwaiting(true)
    await mutate({
      variables: {
        tagId: tagId,
        postId: post._id,
      },
    });
    setIsAwaiting(false)
    refetch()
    captureEvent("tagAddedToItem", {tagId, tagName})
  }, [setIsAwaiting, mutate, refetch, post._id, captureEvent])

  handleOpenTagDialog = async () => {
    const { post, openDialog } = this.props
    openDialog({
      componentName: "EditTagsDialog",
      componentProps: {
        post
      }
    });
  }

  render() {
    const { classes, post, postsRead, currentUser } = this.props
    const { MoveToDraft, BookmarkButton, SuggestCurated, SuggestAlignment, ReportPostMenuItem, DeleteDraft, SubscribeTo } = Components
    if (!post) return null;
    const postAuthor = post.user;

    const isRead = (post._id in postsRead) ? postsRead[post._id] : post.isRead;

    return (
      <div className={classes.actions}>
        { Posts.canEdit(currentUser,post) && <Link to={{pathname:'/editPost', search:`?${qs.stringify({postId: post._id, eventForm: post.isEvent})}`}}>
          <MenuItem>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            Edit
          </MenuItem>
        </Link>}
        { Users.canCollaborate(currentUser, post) &&
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
            subscribeMessage={"Subscribe to posts by "+Users.getDisplayName(postAuthor)}
            unsubscribeMessage={"Unsubscribe from posts by "+Users.getDisplayName(postAuthor)}/>
        </MenuItem>}

        {currentUser && <MenuItem>
          <SubscribeTo document={post} showIcon
            subscribeMessage="Subscribe to comments"
            unsubscribeMessage="Unsubscribe from comments"/>
        </MenuItem>}

        <BookmarkButton post={post} menuItem/>

        <ReportPostMenuItem post={post}/>

        { Users.canDo(currentUser, "posts.edit.all") &&
        <Components.AddTagButton onTagSelected={onTagSelected} />
        // <div onClick={this.handleOpenTagDialog}>
        //     <MenuItem>
        //       <div className={classes.editTags}>Edit Tags</div>
        //     </MenuItem>
        //   </div>
        }
        { isRead
          ? <div onClick={this.handleMarkAsUnread}>
              <MenuItem>
                Mark as Unread
              </MenuItem>
            </div>
          : <div onClick={this.handleMarkAsRead}>
              <MenuItem>
                Mark as Read
              </MenuItem>
            </div>
        }
        <SuggestCurated post={post}/>
        <MoveToDraft post={post}/>
        <DeleteDraft post={post}/>
        { Users.canDo(currentUser, "posts.edit.all") &&
          <span>
            { !post.meta &&
              <div onClick={this.handleMoveToMeta}>
                <Tooltip placement="left" title={
                  forumTypeSetting.get() === 'EAForum' && post.submitToFrontpage ?
                    'user did not select "Moderators may promote to Frontpage" option':''
                }>
                  <MenuItem>
                    Move to {metaName}
                    {forumTypeSetting.get() === 'EAForum' && !post.submitToFrontpage && <NotFPSubmittedWarning className={classes.promoteWarning} />}
                  </MenuItem>
                </Tooltip>
              </div>
            }
            { !post.frontpageDate &&
              <div onClick={this.handleMoveToFrontpage}>
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
               <div onClick={this.handleMoveToPersonalBlog}>
                 <MenuItem>
                   Move to Personal Blog
                 </MenuItem>
               </div>
            }

            { !post.shortform &&
               <div onClick={this.handleMakeShortform}>
                 <MenuItem>
                   Set as user's Shortform Post
                 </MenuItem>
               </div>
            }

            { post.authorIsUnreviewed &&
               <div onClick={this.handleApproveUser}>
                 <MenuItem>
                   Approve New User
                 </MenuItem>
               </div>
            }
          </span>
        }
        <SuggestAlignment post={post}/>
        { Users.canMakeAlignmentPost(currentUser, post) &&
          !post.af && <div onClick={this.handleMoveToAlignmentForum }>
            <MenuItem>
              Ω Move to Alignment
            </MenuItem>
          </div>}
        { Users.canMakeAlignmentPost(currentUser, post) && post.af &&
          <div onClick={this.handleRemoveFromAlignmentForum}>
            <MenuItem>
              Ω Remove Alignment
            </MenuItem>
          </div>
        }
      </div>
    )
  }
}

const PostActionsComponent = registerComponent<ExternalProps>('PostActions', PostActions, {
  styles,
  hocs: [
    withUser,
    withDialog,
    withUpdate({
      collection: Posts,
      fragmentName: 'PostsList',
    }),
    withMutation({
      name: 'markAsReadOrUnread',
      args: {postId: 'String', isRead: 'Boolean'},
    }),
    withUpdate({
      collection: Users,
      fragmentName: 'UsersCurrent'
    }),
    withSetAlignmentPost({
      fragmentName: "PostsList"
    }),
    withPostsRead,
  ]
});

declare global {
  interface ComponentTypes {
    PostActions: typeof PostActionsComponent
  }
}
