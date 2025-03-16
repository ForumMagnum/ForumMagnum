import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

export const HIGHLIGHT_DURATION = 3

export const CONDENSED_MARGIN_BOTTOM = 4

const styles = (theme: ThemeType) => ({
  node: {
    border: theme.palette.border.commentBorder,
    borderRadius: theme.isFriendlyUI ? theme.borderRadius.small : undefined,
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
    borderRadius: theme.isFriendlyUI
      ? `${theme.borderRadius.small}px 0 0 ${theme.borderRadius.small}px`
      : "2px 0 0 2px",
  },
  new: {
    '&&': {
      borderLeft: `solid 5px ${theme.palette.secondary.light}${theme.isFriendlyUI ? '' : '8c'}`,
      '&:hover': {
        borderLeft: `solid 5px ${theme.palette.secondary.main}${theme.isFriendlyUI ? '' : '8c'}`
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
      marginTop: theme.isFriendlyUI ? theme.spacing.unit*2 : theme.spacing.unit*4,
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
      borderRadius: theme.isFriendlyUI ? theme.borderRadius.small : 0,
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
  onClick?: (event: any) => void,
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
  classes: ClassesType<typeof styles>,
}) => {
  const { condensed, postPage, switchAlternatingHighlights } = treeOptions;
  const effectiveNestingLevel = nestingLevel + (switchAlternatingHighlights ? 1 : 0);
  
  const nodeClass = classNames(
    "comments-node",
    nestingLevelToClass(effectiveNestingLevel, classes),
    classes.node,
    className,
    comment.af && "af",
    highlighted && classes.highlightAnimation,
    isChild && classes.child,
    isNewComment && classes.new,
    comment.deleted && classes.deleted,
    isFriendlyUI && showPinnedOnProfile && comment.isPinnedOnProfile && classes.isPinnedOnProfile,
    comment.answer && classes.isAnswer,
    isReplyToAnswer && classes.answerChildComment,
    isChild && isReplyToAnswer && classes.childAnswerComment,
    (effectiveNestingLevel % 2 !== 0) && isReplyToAnswer && classes.oddAnswerComment,
    !hasChildren && classes.answerLeafComment,
    isSingleLine && classes.isSingleLine,
    condensed && classes.condensed,
    postPage && shortform && (effectiveNestingLevel===1) && classes.shortformTop,
    hoverPreview && classes.hoverPreview,
    comment.hideModeratorHat ? false : comment.moderatorHat && classes.moderatorHat,
    comment.promoted && classes.promoted,
  )
  
  return <div className={nodeClass} onClick={onClick} id={id}>
    {children}
  </div>
}

const nestingLevelToClass = (nestingLevel: number, classes: ClassesType<typeof styles>): string => {
  return classNames(
    (nestingLevel === 1)   && classes.commentsNodeRoot,
    (nestingLevel === 1)   && "comments-node-root" ,
    (nestingLevel%2 === 0) && "comments-node-even" ,
    (nestingLevel%2 !== 0) && "comments-node-odd"  ,
    (nestingLevel > 8)  && "comments-node-its-getting-nested-here",
    (nestingLevel > 12) && "comments-node-so-take-off-all-your-margins",
    (nestingLevel > 16) && "comments-node-im-getting-so-nested",
    (nestingLevel > 20) && "comments-node-im-gonna-drop-my-margins",
    (nestingLevel > 24) && "comments-node-what-are-you-even-arguing-about",
    (nestingLevel > 28) && "comments-node-are-you-sure-this-is-a-good-idea",
    (nestingLevel > 32) && "comments-node-seriously-what-the-fuck",
    (nestingLevel > 36) && "comments-node-are-you-curi-and-lumifer-specifically",
    (nestingLevel > 40) && "comments-node-cuz-i-guess-that-makes-sense-but-like-really-tho",
  );
}


const CommentFrameComponent = registerComponent('CommentFrame', CommentFrame, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    CommentFrame: typeof CommentFrameComponent,
  }
}
