import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames'
import CommentIcon from '@material-ui/icons/ModeComment';

const styles = (theme: ThemeType): JssStyles => ({
  commentsIconSmall: {
    width: 20,
    fontSize: 11,
    top: 4,
    height: 24,
    position: "relative",
    flexShrink: 0,
    
    "& .MuiSvgIcon-root": {
      height: "100%",
    },
    '& div': {
      marginTop: -2,
    }
  },
  commentsIconExtraSmall: {
    width: 20,
    fontSize: 11,
    top: 2,
    height: 18,
    position: "relative",
    flexShrink: 0,
    
    "& .MuiSvgIcon-root": {
      height: "100%",
    },
    '& div': {
      marginTop: -2,
    }
  },
  commentsIconLarge: {
    width: 26,
    height: 24,
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
    top: 2,
    '& div': {
      marginTop: -3,
    }
  },
  commentCount: {
    position:"absolute",
    right:"50%",
    top:"50%",
    transform:"translate(50%, -50%)",
    color: theme.palette.icon.commentsBubble.commentCount,
    fontVariantNumeric:"lining-nums",
    ...theme.typography.commentStyle
  },
  neutralColor: {
    color: theme.palette.icon.commentsBubble.neutral,
  },
  noUnreadComments: {
    color: theme.palette.icon.commentsBubble.noUnread,
  },
  unreadComments: {
    color: theme.palette.secondary.light,
  },
  newPromotedComments: {
    color: theme.palette.icon.commentsBubble.newPromoted,
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

const PostsItemComments = ({ commentCount, size, onClick, color, classes }: {
  commentCount: number,
  size: "large"|"small"|"extraSmall",
  onClick?: ()=>void,
  color: "newPromoted"|"unread"|"noUnread"|"neutral"
  classes: ClassesType,
}) => {
  let unreadCommentsClass = classes.noUnreadComments
  if (color==="unread") { unreadCommentsClass = classes.unreadComments }
  if (color==="newPromoted") { unreadCommentsClass = classes.unreadComments }
  if (color==="neutral") { unreadCommentsClass = classes.neutralColor }

  return (
    <div
      className={classNames({
        [classes.commentsIconSmall]: size==="small",
        [classes.commentsIconExtraSmall]: size==="extraSmall",
        [classes.commentsIconLarge]: size==="large",
      })}
      onClick={onClick}
    >
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

