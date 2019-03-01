import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames'
import CommentIcon from '@material-ui/icons/ModeComment';
import { Posts } from "../../lib/collections/posts";

const styles = (theme) => ({
  commentsSpeechBubble: {
    width: 48,
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
  },
  commentCount: {
    position:"absolute",
    right:"50%",
    top:"50%",
    marginTop:-3,
    transform:"translate(50%, -50%)",
    color:"white",
    fontVariantNumeric:"lining-nums",
    ...theme.typography.commentStyle
  },
  noUnreadComments: {
    color: "rgba(0,0,0,.15)",
  },
  unreadComments: {
    color: theme.palette.secondary.light,
  },
  commentCountIcon: {
    position:"absolute",
    right:"50%",
    top:"50%",
    transform:"translate(50%, -50%)",
    width:"30px",
    height:"30px",
  },
})

class PostsItemComments extends Component {
  state = { readStatus: false }

  render () {
    const { classes, post, onClick } = this.props
    const { lastVisitedAt } = post

    const lastCommentedAt = Posts.getLastCommentedAt(post)

    let commentCount = Posts.getCommentCount(post)

    const read = lastVisitedAt;
    const newComments = lastVisitedAt < lastCommentedAt;
    const commentsButtonClassnames = classNames(
      classes.commentsSpeechBubble
    )

    let unreadCommentsClass = (read && newComments && !this.state.readStatus) ? classes.unreadComments : classes.noUnreadComments;

    return (
      <div className={commentsButtonClassnames} onClick={onClick}>
        <CommentIcon className={classNames(classes.commentCountIcon, unreadCommentsClass)}/>
        <div className={classes.commentCount}>
          { commentCount }
        </div>
      </div>
    )
  }
}

registerComponent( 'PostsItemComments', PostsItemComments, withStyles(styles, {name: 'PostsItemComments'}))
