import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';

const styles = (theme: ThemeType) => ({
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

const PostsItemComments = ({ commentCount, small, onClick, unreadComments, newPromotedComments, classes }: {
  commentCount: number,
  small: boolean,
  onClick?: () => void,
  unreadComments: boolean,
  newPromotedComments: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  let unreadCommentsClass =  classes.noUnreadComments
  if (unreadComments) { unreadCommentsClass = classes.unreadComments }
  if (newPromotedComments) { unreadCommentsClass = classes.unreadComments }

  return (
    <div className={small ? classes.commentsIconSmall : classes.commentsIconLarge} onClick={onClick}>
      <CommentIcon className={classNames(classes.commentCountIcon, unreadCommentsClass)}/>
      <div className={classes.commentCount}>
        { commentCount }
      </div>
    </div>
  )
}

export default registerComponent('PostsItemComments', PostsItemComments, {styles});



