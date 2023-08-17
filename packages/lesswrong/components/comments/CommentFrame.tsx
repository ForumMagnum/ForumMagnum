import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import type { CommentTreeOptions } from './commentTree';
import classNames from 'classnames';
import { isEAForum } from '../../lib/instanceSettings';

export const HIGHLIGHT_DURATION = 3

export const CONDENSED_MARGIN_BOTTOM = 4

const styles = (theme: ThemeType): JssStyles => ({
  node: {
    border: theme.palette.border.commentBorder,
    borderRadius: isEAForum ? theme.borderRadius.small : undefined,
    cursor: "default",
    // Higher specificity to override child class (variant syntax)
    '&$deleted': {
      opacity: 0.6
    }
  },
  commentsNodeRoot: {
    borderRadius: theme.borderRadius.small,
  },
  child: {
    marginLeft: theme.spacing.unit,
    marginBottom: 6,
    borderLeft: theme.palette.border.commentBorder,
    borderTop: theme.palette.border.commentBorder,
    borderBottom: theme.palette.border.commentBorder,
    borderRight: "none",
    borderRadius: isEAForum
      ? `${theme.borderRadius.small}px 0 0 ${theme.borderRadius.small}px`
      : "2px 0 0 2px",
  },
  new: {
    '&&': {
      borderLeft: `solid 5px ${theme.palette.secondary.light}`,
      '&:hover': {
        borderLeft: `solid 5px ${theme.palette.secondary.main}`
      },
    }
  },
  deleted: {},
  isAnswer: {
    border: theme.palette.border.answerBorder,
  },
  answerChildComment: {
    marginBottom: theme.spacing.unit,
    border: theme.palette.border.commentBorder,
  },
  childAnswerComment: {
    borderRight: "none"
  },
  oddAnswerComment: {
    backgroundColor: theme.palette.panelBackground.default,
  },
  answerLeafComment: {
    paddingBottom: 0
  },
  isSingleLine: {
    marginBottom: 0,
    borderBottom: "none",
    borderTop: theme.palette.border.commentBorder,
    '&.comments-node-root':{
      marginBottom: CONDENSED_MARGIN_BOTTOM,
      borderBottom: theme.palette.border.commentBorder,
    }
  },
  condensed: {
    '&.comments-node-root':{
      marginBottom: CONDENSED_MARGIN_BOTTOM,
    }
  },
  shortformTop: {
    '&&': {
      marginTop: isEAForum ? theme.spacing.unit*2 : theme.spacing.unit*4,
      marginBottom: 0,
    }
  },
  hoverPreview: {
    '&&': {
      marginBottom: 0
    }
  },
  moderatorHat: {
    "&.comments-node-even": {
      background: theme.palette.panelBackground.commentModeratorHat,
    },
    "&.comments-node-odd": {
      background: theme.palette.panelBackground.commentModeratorHat,
    },
  },
  '@keyframes higlight-animation': {
    from: {
      backgroundColor: theme.palette.panelBackground.commentHighlightAnimation,
      border: theme.palette.border.maxIntensity,
    },
    to: {
      backgroundColor: "none",
      border: theme.palette.border.commentBorder,
    }
  },
  highlightAnimation: {
    animation: `higlight-animation ${HIGHLIGHT_DURATION}s ease-in-out 0s;`
  },
  promoted: {
    border: `solid 1px ${theme.palette.lwTertiary.main}`,
  },
  isPinnedOnProfile: {
    // What we _really_ want to do here is apply a 1px border with the given linear
    // gradient, however, the `border-image` property isn't compatible with
    // `border-radius`. Using the `::before` selector is a hack to get around this.
    "&::before": {
      content: "''",
      position: "absolute",
      zIndex: -1,
      top: 1,
      right: 1,
      bottom: 1,
      left: 1,
      boxSizing: "border-box",
      backgroundColor: theme.palette.panelBackground.default,
      borderRadius: isEAForum ? theme.borderRadius.small : 0,
    },
    position: "relative",
    backgroundImage: `linear-gradient(to bottom right, ${theme.palette.border.secondaryHighlight}, ${theme.palette.border.primaryHighlight})`,
    border: "none",
    zIndex: 0,
    '&.CommentFrame-isAnswer': {
      backgroundImage: `linear-gradient(to bottom right, ${theme.palette.border.secondaryHighlight2}, ${theme.palette.border.primaryHighlight2})`,
    },
  },
});

const CommentFrame = ({
  comment,
  treeOptions,
  onClick,
  id,
  nestingLevel,
  hasChildren,
  highlighted,
  isSingleLine,
  isChild,
  isNewComment,
  isReplyToAnswer,
  hoverPreview,
  shortform,
  showPinnedOnProfile,
  children,
  className,
  classes
}: {
  comment: CommentsList,
  treeOptions: CommentTreeOptions,
  onClick?: (event: any)=>void,
  id?: string,
  
  nestingLevel: number,
  hasChildren?: boolean,
  highlighted?: boolean,
  isSingleLine?: boolean,
  isChild?: boolean,
  isNewComment?: boolean,
  isReplyToAnswer?: boolean,
  hoverPreview?: boolean,
  shortform?: boolean,
  showPinnedOnProfile?: boolean,
  
  children: React.ReactNode,
  className?: string,
  classes: ClassesType,
}) => {
  const { condensed, postPage } = treeOptions;
  
  const nodeClass = classNames(
    "comments-node",
    nestingLevelToClass(nestingLevel, classes),
    classes.node,
    className,
    {
      "af":comment.af,
      [classes.highlightAnimation]: highlighted,
      [classes.child]: isChild,
      [classes.new]: isNewComment,
      [classes.deleted]: comment.deleted,
      [classes.isPinnedOnProfile]: isEAForum && showPinnedOnProfile && comment.isPinnedOnProfile,
      [classes.isAnswer]: comment.answer,
      [classes.answerChildComment]: isReplyToAnswer,
      [classes.childAnswerComment]: isChild && isReplyToAnswer,
      [classes.oddAnswerComment]: (nestingLevel % 2 !== 0) && isReplyToAnswer,
      [classes.answerLeafComment]: !hasChildren,
      [classes.isSingleLine]: isSingleLine,
      [classes.condensed]: condensed,
      [classes.shortformTop]: postPage && shortform && (nestingLevel===1),
      [classes.hoverPreview]: hoverPreview,
      [classes.moderatorHat]: comment.hideModeratorHat ? false : comment.moderatorHat,
      [classes.promoted]: comment.promoted
    }
  )
  
  return <div className={nodeClass} onClick={onClick} id={id}>
    {children}
  </div>
}

const nestingLevelToClass = (nestingLevel: number, classes: ClassesType): string => {
  return classNames({
    [classes.commentsNodeRoot] : nestingLevel === 1,
    "comments-node-root" : nestingLevel === 1,
    "comments-node-even" : nestingLevel % 2 === 0,
    "comments-node-odd"  : nestingLevel % 2 !== 0,
    "comments-node-its-getting-nested-here": nestingLevel > 8,
    "comments-node-so-take-off-all-your-margins": nestingLevel > 12,
    "comments-node-im-getting-so-nested": nestingLevel > 16,
    "comments-node-im-gonna-drop-my-margins": nestingLevel > 20,
    "comments-node-what-are-you-even-arguing-about": nestingLevel > 24,
    "comments-node-are-you-sure-this-is-a-good-idea": nestingLevel > 28,
    "comments-node-seriously-what-the-fuck": nestingLevel > 32,
    "comments-node-are-you-curi-and-lumifer-specifically": nestingLevel > 36,
    "comments-node-cuz-i-guess-that-makes-sense-but-like-really-tho": nestingLevel > 40,
  });
}


const CommentFrameComponent = registerComponent('CommentFrame', CommentFrame, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    CommentFrame: typeof CommentFrameComponent,
  }
}

