import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames'
import CommentIcon from '@material-ui/icons/ModeComment';
import { Posts } from "../../lib/collections/posts";

const styles = (theme) => ({
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
    color: "rgba(0,0,0,.22)",
  },
  unreadComments: {
    color: theme.palette.secondary.light,
  },
  commentCountIcon: {
    position:"absolute",
    right:"50%",
    top:"50%",
    transform:"translate(50%, -50%)",
    width:30,
    height:30,
  },
})

const PostsItemComments = ({ classes, post, onClick, unreadComments }: {
  classes: ClassesType,
  post: PostsBase,
  onClick: any,
  unreadComments: any,
}) => {
  let commentCount = Posts.getCommentCount(post)

  let unreadCommentsClass = unreadComments ? classes.unreadComments : classes.noUnreadComments;

  return (
    <div className={classes.root} onClick={onClick}>
      <CommentIcon className={classNames(classes.commentCountIcon, unreadCommentsClass)}/>
      <div className={classes.commentCount}>
        { commentCount }
      </div>
    </div>
  )
}

const PostsItemCommentsComponent = registerComponent('PostsItemComments', PostsItemComments, {styles});

declare global {
  interface ComponentTypes {
    PostsItemComments: typeof PostsItemCommentsComponent
  }
}

