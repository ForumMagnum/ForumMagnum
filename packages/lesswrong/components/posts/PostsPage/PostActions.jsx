import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components, withUpdate } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users'
import withUser from '../../common/withUser'
import { Posts } from '../../../lib/collections/posts';
import withSetAlignmentPost from "../../alignment-forum/withSetAlignmentPost";
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper.js';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import EditIcon from '@material-ui/icons/Edit'

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
})

class PostActions extends Component {

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

  render() {
    const { classes, post, currentUser } = this.props
    const { MoveToDraft, SuggestCurated, SuggestAlignment, ReportPostMenuItem, DeleteDraft } = Components
    return (
      <div className={classes.actions}>
        { Posts.canEdit(currentUser,post) && <Link to={{pathname:'/editPost', query:{postId: post._id, eventForm: post.isEvent}}}>
          <MenuItem>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            Edit
          </MenuItem>
        </Link>}
        <ReportPostMenuItem post={post}/>

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
        <SuggestCurated post={post}/>
        <MoveToDraft post={post}/>
        <DeleteDraft post={post}/>
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
  [withSetAlignmentPost, {
    fragmentName: "PostsList"
  }]
)
