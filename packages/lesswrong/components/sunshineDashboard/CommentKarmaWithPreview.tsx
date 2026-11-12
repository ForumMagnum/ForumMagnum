import React from 'react';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import classNames from 'classnames';
import LWPopper from "../common/LWPopper";
import CommentsNode from "../comments/CommentsNode";
import FormatDate from "../common/FormatDate";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import LLMScoreBadge from './supermod/LLMScoreBadge';

const CommentLlmScoreQuery = gql(`
  query CommentLlmScorePreview($documentId: String) {
    comment(selector: { documentId: $documentId }) {
      result {
        _id
        automatedContentEvaluations {
          ...AutomatedContentEvaluationsFragment
        }
      }
    }
  }
`);

const styles = defineStyles('CommentKarmaWithPreview', (theme: ThemeType) => ({
  root: {
    marginRight: 8,
    whiteSpace: "nowrap"
  },
  commentPreview: {
    maxWidth: 600,
    maxHeight: '50vh',
    overflow: 'auto'
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 12px',
    background: theme.palette.background.default,
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
}))


const CommentKarmaWithPreview = ({comment, displayTitle = false, reviewedAt, children, showLlmScore = false}: {
  comment: CommentsListWithParentMetadata | SunshineCommentsList,
  displayTitle?: boolean,
  children?: React.ReactNode,
  showLlmScore?: boolean,
  reviewedAt?: Date
}) => {
  const classes = useStyles(styles);
  const { hover, everHovered, anchorEl, eventHandlers } = useHover();
  const suppliedLlmScoreComment = comment && 'automatedContentEvaluations' in comment ? comment : undefined;
  const { data: llmScoreData } = useQuery(CommentLlmScoreQuery, {
    variables: { documentId: comment?._id },
    skip: !showLlmScore || !comment || !everHovered || !!suppliedLlmScoreComment,
    fetchPolicy: 'cache-first',
  });
  const llmScoreComment = suppliedLlmScoreComment ?? llmScoreData?.comment?.result;
  if (!comment) return null 

  return <span className={classNames(classes.root, {[classes.titleDisplay]: displayTitle})} {...eventHandlers}>
    {children ?? <Link className={classNames({[classes.highlight]: !reviewedAt || new Date(comment.postedAt) > reviewedAt, [classes.deleted]: comment.deleted, [classes.default]: !comment.deleted})}
      to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}
    >
      {displayTitle && <span className={classes.scoreTitleFormat}>
        <FormatDate date={comment.postedAt} />
      </span>}
      <span className={displayTitle ? classes.scoreTitleFormat : undefined}>
        {comment.baseScore} 
      </span>
      {displayTitle && comment.post?.title }
    </Link>}
    <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement={displayTitle ? "right-start" : "bottom-start"}
      >
      <div className={classes.commentPreview}>
        {showLlmScore && llmScoreComment && <div className={classes.previewHeader}>
          <LLMScoreBadge
            documentId={comment._id}
            automatedContentEvaluations={llmScoreComment.automatedContentEvaluations}
            contentHtml={comment.contents?.html ?? ''}
            contentType="Comment"
            showWhenEmpty
          />
        </div>}
        <CommentsNode treeOptions={{showPostTitle: true}} comment={comment} forceUnTruncated forceUnCollapsed/>
      </div>
    </LWPopper>
  </span>
}

export default CommentKarmaWithPreview;
