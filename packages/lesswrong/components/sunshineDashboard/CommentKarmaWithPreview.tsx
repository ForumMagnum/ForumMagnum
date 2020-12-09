import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: 8,
    wordBreak: "break-word"
  },
  commentPreview: {
    maxWidth: 600
  }
})


const CommentKarmaWithPreview = ({ comment, classes }: {
  comment: CommentsList,
  classes: ClassesType,
}) => {
  const { hover, anchorEl, eventHandlers } = useHover();
  const { LWPopper, CommentsNode } = Components

  if (!comment) return null 

  return <span className={classes.root} {...eventHandlers}>
    <Link to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}>{comment.baseScore}</Link>
    <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={{
          flip: {
            behavior: ["bottom-start", "top-end", "bottom-start"],
            boundariesElement: 'viewport'
          }
        }}
      >
      <div className={classes.commentPreview}>
        <CommentsNode treeOptions={{}} comment={comment}/>
      </div>
    </LWPopper>
  </span>
}

const CommentKarmaWithPreviewComponent = registerComponent('CommentKarmaWithPreview', CommentKarmaWithPreview, {styles});

declare global {
  interface ComponentTypes {
    CommentKarmaWithPreview: typeof CommentKarmaWithPreviewComponent
  }
}

