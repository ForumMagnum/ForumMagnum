import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import { commentBodyStyles, postBodyStyles } from '../../themes/stylePiping'
import { useHover } from '../common/withHover';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import { commentGetKarma } from '../../lib/collections/comments/helpers'
import { isMobile } from '../../lib/utils/isMobile'
import { styles as commentsItemStyles } from './CommentsItem/CommentsItem';
import { CommentTreeOptions } from './commentTree';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    cursor: "pointer",
  },
  commentInfo: {
    borderRadius: 3,
    backgroundColor: "#f0f0f0",
    '&:hover': {
      backgroundColor: "#e0e0e0",
    },
    ...commentBodyStyles(theme),
    marginTop: 0,
    marginBottom: 0,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    color: "rgba(0,0,0,.6)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  username: {
    display:"inline-block",
    padding: 5,
    '& a, & a:hover': {
      color: "rgba(0,0,0,.87)",
    },
    fontWeight: 600,
    marginRight: 10,
  },
  karma: {
    display:"inline-block",
    textAlign: "center",
    width: 30,
    paddingRight: 5,
  },
  date: {
    display:"inline-block",
    padding: 5,
    paddingRight: theme.spacing.unit,
    paddingLeft: theme.spacing.unit
  },
  truncatedHighlight: {
    padding: 5,
    ...commentBodyStyles(theme),
    marginTop: 0,
    marginBottom: 0,
    '& *': {
      display: "inline"
    },
    '& blockquote, & br, & figure, & img': {
      display: "none"
    },
    '& p': {
      marginRight: 6
    },
    '& strong': {
      fontWeight: theme.typography.body2.fontWeight
    }
  },
  highlight: {
    ...commentBodyStyles(theme),
    backgroundColor: "white",
    padding: theme.spacing.unit*1.5,
    width: "inherit",
    maxWidth: 625,
    position: "absolute",
    top: "calc(100% - 20px)",
    right: 0,
    zIndex: 5,
    border: "solid 1px rgba(0,0,0,.1)",
    boxShadow: "0 0 10px rgba(0,0,0,.2)",
    maxHeight: 500,
    overflow: "hidden",
    '& img': {
      maxHeight: "200px"
    }
  },
  isAnswer: {
    ...postBodyStyles(theme),
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    '& a, & a:hover': {
      textShadow:"none",
      color: theme.typography.body1.color,
      backgroundImage: "none"
    }
  },
  odd: {
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "#f3f3f3",
    }
  },
  metaNotice: {
    ...commentsItemStyles(theme).metaNotice,
    marginRight: theme.spacing.unit
  }
})

const SingleLineComment = ({treeOptions, comment, classes, nestingLevel, parentCommentId, hideKarma }: {
  treeOptions: CommentTreeOptions,
  comment: CommentsList,
  nestingLevel: number,
  parentCommentId?: string,
  hideKarma?: boolean,
  classes: ClassesType,
}) => {
  const {hover} = useHover();
  
  if (!comment) return null
  
  const { enableHoverPreview=true, hideSingleLineMeta, post } = treeOptions;

  const plaintextMainText = comment.contents?.plaintextMainText;
  const { CommentBody, ShowParentComment, CommentUserName, CommentShortformIcon } = Components

  const displayHoverOver = hover && (comment.baseScore > -5) && !isMobile() && enableHoverPreview

  const renderHighlight = (comment.baseScore > -5) && !comment.deleted

  return (
    <div className={classes.root}>
      <div className={classNames(classes.commentInfo, {
          [classes.isAnswer]: comment.answer, 
          [classes.odd]:((nestingLevel%2) !== 0),
        })}>
        {post && <CommentShortformIcon comment={comment} post={post} simple={true} />}

        { parentCommentId!=comment.parentCommentId &&
          <ShowParentComment comment={comment} />
        }
        {!hideKarma && <span className={classes.karma}>
          {commentGetKarma(comment)}
        </span>}
        <span className={classes.username}>
          <CommentUserName comment={comment} simple={true}/>
        </span>
        {!hideSingleLineMeta && <span className={classes.date}>
          <Components.FormatDate date={comment.postedAt} tooltip={false}/>
        </span>}
        {renderHighlight && <span className={classes.truncatedHighlight}> 
          { comment.nominatedForReview && !hideSingleLineMeta && <span className={classes.metaNotice}>Nomination</span>}
          { comment.reviewingForReview && !hideSingleLineMeta && <span className={classes.metaNotice}>Review</span>}
          { comment.promoted && !hideSingleLineMeta && <span className={classes.metaNotice}>Promoted</span>}
          {plaintextMainText} 
        </span>}      
      </div>
      {displayHoverOver && <span className={classNames(classes.highlight)}>
        <CommentBody truncated comment={comment}/>
      </span>}
    </div>
  )
};

const SingleLineCommentComponent = registerComponent('SingleLineComment', SingleLineComment, {
  styles,
  hocs: [withErrorBoundary],
  areEqual: {
    treeOptions: "shallow",
  },
});

declare global {
  interface ComponentTypes {
    SingleLineComment: typeof SingleLineCommentComponent,
  }
}

