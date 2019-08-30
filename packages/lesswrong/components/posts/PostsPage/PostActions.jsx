import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components, withUpdate, withMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users'
import withUser from '../../common/withUser'
import { Posts } from '../../../lib/collections/posts';
import withSetAlignmentPost from "../../alignment-forum/withSetAlignmentPost";
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper.js';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import EditIcon from '@material-ui/icons/Edit'
import qs from 'qs'

const styles = theme => ({
  root: {
    margin: 0,
    ...theme.typography.h2,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '2.5rem',
      marginBottom: 10,
      maxWidth: '80%'
    }
  },
})

class PostActions extends Component {

  handleMarkAsRead = () => {
    this.props.markAsReadOrUnread({
      postId: this.props.post._id,
      isRead: true,
    });
  }
  
  handleMarkAsUnread = () => {
    this.props.markAsReadOrUnread({
      postId: this.props.post._id,
      isRead: false,
    });
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
        curatedDate: null,
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
      data: {reviewedByUserId: currentUser._id}
    })
  }

  render() {
    const { classes, post, currentUser } = this.props
    const { MoveToDraft, SuggestCurated, SuggestAlignment, ReportPostMenuItem, DeleteDraft } = Components
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
        <ReportPostMenuItem post={post}/>
        { post.isRead
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
                <MenuItem>
                  Move to Meta
                </MenuItem>
              </div>
            }
            { !post.frontpageDate &&
              <div onClick={this.handleMoveToFrontpage}>
                <MenuItem>
                  Move to Frontpage
                </MenuItem>
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

registerComponent('PostActions', PostActions,
  withStyles(styles, {name: "PostActions"}),
  withUser,
  [withUpdate, {
    collection: Posts,
    fragmentName: 'PostsList',
  }],
  [withMutation, {
    name: 'markAsReadOrUnread',
    args: {postId: 'String', isRead: 'Boolean'},
  }],
  [withUpdate, {
    collection: Users,
    fragmentName: 'UsersCurrent'
  }],
  [withSetAlignmentPost, {
    fragmentName: "PostsList"
  }]
);
