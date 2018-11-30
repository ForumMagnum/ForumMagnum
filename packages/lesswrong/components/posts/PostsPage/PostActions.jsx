import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components, withEdit } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users'
import withUser from '../../common/withUser'
import { Posts } from '../../../lib/collections/posts';
import withSetAlignmentPost from "../../alignment-forum/withSetAlignmentPost";

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
    const { post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {meta: true, metaDate: new Date()},
      unset: {
        frontpageDate: true,
        curatedDate: true,
      }
    })
  }

  handleMoveToFrontpage = () => {
    const { post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: { frontpageDate: new Date() },
      unset: {
        meta: true
      }
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

  handleMoveToPersonalBlog = () => {
    const { post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {},
      unset: {
        curatedDate: true,
        frontpageDate: true,
        meta: true
      }
    })
  }
  render() {
    const { classes, post, Container, currentUser } = this.props
    return (
      <div className={classes.actions}>
        { Users.canDo(currentUser, "posts.edit.all") &&
          <span>
            { !post.meta &&
              <div onClick={this.handleMoveToMeta}>
                <Container>
                  Move to Meta
                </Container>
              </div>
            }
            { !post.frontpageDate &&
              <div onClick={this.handleMoveToFrontpage}>
                <Container>
                  Move to Frontpage
                </Container>
              </div>
            }
            { (post.frontpageDate || post.meta || post.curatedDate) &&
               <div onClick={this.handleMoveToPersonalBlog}>
                 <Container>
                   Move to Personal Blog
                 </Container>
               </div>
            }
          </span>
        }
        <Components.SuggestAlignment post={post} Container={Container}/>
        { Users.canMakeAlignmentPost(currentUser, post) &&
          !post.af && <div onClick={this.handleMoveToAlignmentForum }>
            <Container>
              Ω Move to Alignment
            </Container>
          </div>}
        { Users.canMakeAlignmentPost(currentUser, post) && post.af &&
          <div onClick={this.handleRemoveFromAlignmentForum}>
            <Container>
              Ω Remove Alignment
            </Container>
          </div>
        }
        <Components.SuggestCurated post={post} Container={Container}/>
      </div>
    )
  }
}
const withEditOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
};

const setAlignmentOptions = {
  fragmentName: "PostsList"
}



registerComponent('PostActions', PostActions,
  withStyles(styles, {name: "PostActions"}),
  withUser,
  [withEdit, withEditOptions],
  [withSetAlignmentPost, setAlignmentOptions])
