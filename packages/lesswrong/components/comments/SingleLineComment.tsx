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
import { POST_PREVIEW_WIDTH } from '../posts/PostsPreviewTooltip';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    cursor: "pointer",
  },
  commentInfo: {
    display: "flex",
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
  parentComment: {
    position: "relative",
    top: 5,
  },
  shortformIcon: {
    marginTop: 4,
  },
  karma: {
    display:"inline-block",
    textAlign: "center",
    width: 30,
    paddingTop: 5,
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
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    
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
    backgroundColor: "white",
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
  highlightPadding: {
    padding: theme.spacing.unit*1.5
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
  },
  postTitle: {
    ...commentsItemStyles(theme).metaNotice,
    marginRight: 20
  },
  preview: {
    backgroundColor: "white",
    border: "solid 1px rgba(0,0,0,.1)",
    boxShadow: "0 0 10px rgba(0,0,0,.2)",
    width: POST_PREVIEW_WIDTH
  }
})

const SingleLineComment = ({treeOptions, comment, nestingLevel, parentCommentId, hideKarma, showDescendentCount, classes }: {
  treeOptions: CommentTreeOptions,
  comment: CommentsList,
  nestingLevel: number,
  parentCommentId?: string,
  hideKarma?: boolean,
  showDescendentCount?: boolean,
  classes: ClassesType,
}) => {
  const {hover, anchorEl, eventHandlers} = useHover();
  
  if (!comment) return null
  
  const { enableHoverPreview=true, hideSingleLineMeta, post, singleLineLargePreview, singleLinePostTitle } = treeOptions;

  const plaintextMainText = comment.contents?.plaintextMainText;
  const { CommentsNode, CommentBody, ShowParentComment, CommentUserName, CommentShortformIcon, PostsItemComments, LWPopper } = Components

  const displayHoverOver = hover && (comment.baseScore > -5) && !isMobile() && enableHoverPreview

  const renderHighlight = (comment.baseScore > -5) && !comment.deleted

  return (
    <div className={classes.root} {...eventHandlers}>
      <div className={classNames(classes.commentInfo, {
          [classes.isAnswer]: comment.answer, 
          [classes.odd]:((nestingLevel%2) !== 0),
        })}>
        {post && <div className={classes.shortformIcon}><CommentShortformIcon comment={comment} post={post} simple={true} /></div>}

        {parentCommentId!=comment.parentCommentId && <span className={classes.parentComment}>
          <ShowParentComment comment={comment} />
        </span>}
        {!hideKarma && <span className={classes.karma}>
          {commentGetKarma(comment)}
        </span>}
        <CommentUserName comment={comment} simple={true} className={classes.username} />
        {!hideSingleLineMeta && <span className={classes.date}>
          <Components.FormatDate date={comment.postedAt} tooltip={false}/>
        </span>}
        {renderHighlight && <span className={classes.truncatedHighlight}> 
          {singleLinePostTitle && <span className={classes.postTitle}>{post?.title}</span>}
          { comment.nominatedForReview && !hideSingleLineMeta && <span className={classes.metaNotice}>Nomination</span>}
          { comment.reviewingForReview && !hideSingleLineMeta && <span className={classes.metaNotice}>Review</span>}
          { comment.promoted && !hideSingleLineMeta && <span className={classes.metaNotice}>Promoted</span>}
          {plaintextMainText}
        </span>}
        {showDescendentCount && comment.descendentCount>0 && <PostsItemComments
          small={true}
          commentCount={comment.descendentCount}
          unreadComments={false}
          newPromotedComments={false}
        />}
      </div>
      <LWPopper
        open={displayHoverOver && !!singleLineLargePreview}
        anchorEl={anchorEl}
        placement="bottom-end"
        modifiers={{
          flip: {
            behavior: ["bottom-end"],
            boundariesElement: 'viewport'
          }
        }}
      >
          <div className={classes.preview}>
            <CommentsNode truncated nestingLevel={1} comment={comment} treeOptions={treeOptions} forceNotSingleLine/>
          </div>
      </LWPopper>
      {displayHoverOver && !singleLineLargePreview && <span className={classNames(classes.highlight)}>
         <div className={classes.highlightPadding}><CommentBody truncated comment={comment}/></div>
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

