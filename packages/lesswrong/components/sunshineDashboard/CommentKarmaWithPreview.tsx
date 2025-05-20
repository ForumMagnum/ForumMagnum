import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import classNames from 'classnames';
import LWPopper from "../common/LWPopper";
import CommentsNodeInner from "../comments/CommentsNode";
import FormatDate from "../common/FormatDate";

const styles = (theme: ThemeType) => ({
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
    width: 30,
    marginRight: 8,
    display: "inline-block",
    textAlign: "center"
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
  classes: ClassesType<typeof styles>,
  displayTitle: boolean,
  reviewedAt?: Date
}) => {
  const { hover, anchorEl, eventHandlers } = useHover();
  if (!comment) return null 

  return <span className={classNames(classes.root, {[classes.titleDisplay]: displayTitle})} {...eventHandlers}>
    <Link className={classNames({[classes.highlight]: !reviewedAt || new Date(comment.postedAt) > reviewedAt, [classes.deleted]: comment.deleted, [classes.default]: !comment.deleted})}
      to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}
    >
      {displayTitle && <span className={classes.scoreTitleFormat}>
        <FormatDate date={comment.postedAt} />
      </span>}
      <span className={displayTitle ? classes.scoreTitleFormat : undefined}>
        {comment.baseScore} 
      </span>
      {displayTitle && comment.post?.title }
    </Link>
    <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement={displayTitle ? "right-start" : "bottom-start"}
      >
      <div className={classes.commentPreview}>
        <CommentsNodeInner treeOptions={{showPostTitle: true}} comment={comment} forceUnTruncated forceUnCollapsed/>
      </div>
    </LWPopper>
  </span>
}

export default registerComponent('CommentKarmaWithPreview', CommentKarmaWithPreview, {styles});



