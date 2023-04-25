import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: 8,
    whiteSpace: "nowrap"
  },
  commentPreview: {
    maxWidth: 600
  },
  deleted: {
    opacity: .6,
    '&&': {
      fontWeight: 400
    }
  },
  default: {
    color: theme.palette.grey[900],
  },
  scoreTitleFormat: {
    width: 20,
    display: "inline-block"
  },
  titleDisplay: {
    display: "block"
  },
  highlight: {
    color: theme.palette.primary.main,
    fontWeight: 600
  }
})


const CommentKarmaWithPreview = ({ comment, classes, displayTitle, reviewedAt }: {
  comment: CommentsListWithParentMetadata,
  classes: ClassesType,
  displayTitle: boolean,
  reviewedAt: Date
}) => {
  const { hover, anchorEl, eventHandlers } = useHover();
  const { LWPopper, CommentsNode } = Components

  if (!comment) return null 

  return <span className={classNames(classes.root, {[classes.titleDisplay]: displayTitle})} {...eventHandlers}>
    <Link className={classNames({[classes.highlight]: comment.postedAt > reviewedAt, [classes.deleted]: comment.deleted, [classes.default]: !comment.deleted})}
      to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}
    >
      <span className={displayTitle ? classes.scoreTitleFormat : null}>{comment.baseScore} </span>
      {displayTitle && comment.post?.title }
    </Link>
    <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement={displayTitle ? "right-start" : "bottom-start"}
      >
      <div className={classes.commentPreview}>
        <CommentsNode treeOptions={{showPostTitle: true}} comment={comment} forceUnTruncated forceUnCollapsed/>
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

