import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useHover } from '../common/withHover';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import { commentGetKarma } from '../../lib/collections/comments/helpers'
import { isMobile } from '../../lib/utils/isMobile'
import { CommentTreeOptions } from './commentTree';
import { coreTagIconMap } from '../tagging/CoreTagIcon';
import { metaNoticeStyles } from './CommentsItem/CommentsItemMeta';
import { isFriendlyUI } from '../../themes/forumTheme';

export const SINGLE_LINE_PADDING_TOP = 5

export const singleLineStyles = (theme: ThemeType) => ({
  borderRadius: 3,
  backgroundColor: theme.palette.panelBackground.singleLineComment,
  '&:hover': {
    backgroundColor: theme.palette.panelBackground.singleLineCommentHovered,
  },
  marginTop: 0,
  marginBottom: 0,
  paddingLeft: theme.spacing.unit,
  paddingRight: theme.spacing.unit,
  color: theme.palette.text.dim60,
  whiteSpace: "nowrap",
  fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
})

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    cursor: "pointer",
  },
  commentInfo: {
    display: "flex",
    ...singleLineStyles(theme)
  },
  username: {
    display:"inline-block",
    padding: SINGLE_LINE_PADDING_TOP,
    '& a, & a:hover': {
      color: theme.palette.link.unmarked,
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
  tagIcon: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: -2,
    marginRight: 8,
    '& svg': {
      width: 12,
      height: 12,
      fill: theme.palette.grey[600],
    },
  },
  karma: {
    display:"inline-block",
    textAlign: "center",
    paddingTop: SINGLE_LINE_PADDING_TOP,
    paddingRight: SINGLE_LINE_PADDING_TOP,
    flexGrow: 0,
    flexShrink: 0,
  },
  date: {
    display:"inline-block",
    padding: SINGLE_LINE_PADDING_TOP,
    paddingRight: theme.spacing.unit,
    paddingLeft: theme.spacing.unit
  },
  truncatedHighlight: {
    padding: SINGLE_LINE_PADDING_TOP,
    display: "inline",
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
    backgroundColor: theme.palette.panelBackground.default,
    width: "inherit",
    maxWidth: 625,
    position: "absolute",
    top: "calc(100% - 20px)",
    right: 0,
    zIndex: 5,
    border: theme.palette.border.faint,
    boxShadow: theme.palette.boxShadow.comment,
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
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    '& a, & a:hover': {
      textShadow:"none",
      color: theme.typography.body1.color,
      backgroundImage: "none"
    }
  },
  odd: {
    backgroundColor: theme.palette.panelBackground.default,
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.singleLineCommentOddHovered,
    }
  },
  metaNotice: {
    ...metaNoticeStyles(theme),
    marginRight: theme.spacing.unit
  },
  postTitle: {
    ...metaNoticeStyles(theme),
    marginRight: 20
  },
  preview: {
    width: 400
  },
  deemphasize: {
    opacity: 0.5
  }
})

const SingleLineComment = ({treeOptions, comment, nestingLevel, parentCommentId, hideKarma, showDescendentCount, displayTagIcon=false, classes }: {
  treeOptions: CommentTreeOptions,
  comment: CommentsList,
  nestingLevel: number,
  parentCommentId?: string,
  hideKarma?: boolean,
  showDescendentCount?: boolean,
  displayTagIcon?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const {anchorEl, hover, eventHandlers} = useHover();
  
  if (!comment) return null
  
  const { enableHoverPreview=true, hideSingleLineMeta, post, singleLinePostTitle, hideParentCommentToggle, deemphasizeCommentsExcludingUserIds } = treeOptions;

  const contentToRender = comment.title || comment.contents?.plaintextMainText;
  const { ShowParentComment, CommentUserName, CommentShortformIcon, PostsItemComments, ContentStyles, LWPopper, CommentsNode, CoreTagIcon } = Components

  const displayHoverOver = hover && (comment.baseScore > -5) && !isMobile() && enableHoverPreview
  const renderHighlight = (comment.baseScore > -5) && !comment.deleted
  const actuallyDisplayTagIcon = !!(displayTagIcon && comment.tag && coreTagIconMap[comment.tag.slug])
  
  const effectiveNestingLevel = nestingLevel + (treeOptions.switchAlternatingHighlights ? 1 : 0);
  
  const deempphasizeComment = !!deemphasizeCommentsExcludingUserIds && !deemphasizeCommentsExcludingUserIds.has(comment.userId)

  return (
    <div className={classes.root} {...eventHandlers}>
      <ContentStyles
        contentType={comment.answer ? "post" : "comment"}
        className={classNames(
          classes.commentInfo,
          comment.answer && classes.isAnswer,
          ((effectiveNestingLevel%2) !== 0) && classes.odd,
          deempphasizeComment && classes.deemphasize
        )}
      >
        {post && <div className={classes.shortformIcon}><CommentShortformIcon comment={comment} post={post} simple={true} /></div>}
        {actuallyDisplayTagIcon && <div className={classes.tagIcon}>
          <CoreTagIcon tag={comment.tag} />
        </div>}

        {/* We're often comparing null to undefined, so we need to explicitly use a double-eq-negation */}
        {/* eslint-disable-next-line eqeqeq */}
        {!hideParentCommentToggle && parentCommentId!=comment.parentCommentId && <span className={classes.parentComment}>
          <ShowParentComment comment={comment} />
        </span>}
        {!hideKarma && <span className={classes.karma}>
          {commentGetKarma(comment)}
        </span>}
        <CommentUserName
          comment={comment}
          simple
          className={classes.username}
        />
        {!hideSingleLineMeta && <span className={classes.date}>
          <Components.FormatDate date={comment.postedAt} tooltip={false}/>
        </span>}
        {renderHighlight && <ContentStyles contentType="comment" className={classes.truncatedHighlight}> 
          {singleLinePostTitle && <span className={classes.postTitle}>{post?.title}</span>}
          { comment.nominatedForReview && !hideSingleLineMeta && <span className={classes.metaNotice}>Nomination</span>}
          { comment.reviewingForReview && !hideSingleLineMeta && <span className={classes.metaNotice}>Review</span>}
          { comment.promoted && !hideSingleLineMeta && <span className={classes.metaNotice}>Pinned</span>}
          {contentToRender}
        </ContentStyles>}
        {showDescendentCount && comment.descendentCount>0 && <PostsItemComments
          small={true}
          commentCount={comment.descendentCount}
          unreadComments={false}
          newPromotedComments={false}
        />}
      </ContentStyles>
      <LWPopper
        open={displayHoverOver}
        anchorEl={anchorEl}
        placement="bottom-end"
        clickable={false}
      >
          <div className={classes.preview}>
            <CommentsNode
              truncated
              nestingLevel={1}
              comment={comment}
              treeOptions={{
                ...treeOptions,
                hideReply: true,
                forceSingleLine: false,
                forceNotSingleLine: true,
                switchAlternatingHighlights: false,
              }}
              hoverPreview
            />
          </div>
      </LWPopper>
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
