import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { commentsNodeRootMarginBottom, maxSmallish, maxTiny } from '@/themes/globalStyles/globalStyles';

export const HIGHLIGHT_DURATION = 3

export const CONDENSED_MARGIN_BOTTOM = 4

export const commentFrameStyles = defineStyles("CommentFrame", (theme: ThemeType) => ({
  node: {
    border: theme.palette.border.commentBorder,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : undefined,
    cursor: "default",
    // Higher specificity to override child class (variant syntax)
    '&$deleted': {
      opacity: 0.6
    }
  },
  even: {
    backgroundColor: theme.palette.panelBackground.commentNodeEven,
  },
  odd: {
    backgroundColor: theme.palette.panelBackground.commentNodeOdd,
  },
  commentsNodeRoot: {
    borderRadius: theme.borderRadius.small,
    marginBottom: commentsNodeRootMarginBottom,
  
    [maxSmallish]: {
      marginBottom: 10,
    },
    [maxTiny]: {
      marginBottom: 8,
      paddingTop: 5,
    },
    
    backgroundColor: theme.palette.panelBackground.default,
  },

  child: {
    marginLeft: theme.spacing.unit,
    marginBottom: 6,
    borderLeft: theme.palette.border.commentBorder,
    borderTop: theme.palette.border.commentBorder,
    borderBottom: theme.palette.border.commentBorder,
    borderRight: "none",
    borderRadius: isFriendlyUI
      ? `${theme.borderRadius.small}px 0 0 ${theme.borderRadius.small}px`
      : "2px 0 0 2px",
  },
  new: {
    '&&': {
      borderLeft: `solid 5px ${theme.palette.secondary.light}${isFriendlyUI ? '' : '8c'}`,
      '&:hover': {
        borderLeft: `solid 5px ${theme.palette.secondary.main}${isFriendlyUI ? '' : '8c'}`
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
    '&$commentsNodeRoot':{
      marginBottom: CONDENSED_MARGIN_BOTTOM,
      borderBottom: theme.palette.border.commentBorder,
    }
  },
  condensed: {
    '&$commentsNodeRoot':{
      marginBottom: CONDENSED_MARGIN_BOTTOM,
    }
  },
  shortformTop: {
    '&&': {
      marginTop: isFriendlyUI ? theme.spacing.unit*2 : theme.spacing.unit*4,
      marginBottom: 0,
    }
  },
  hoverPreview: {
    '&&': {
      marginBottom: 0
    }
  },
  moderatorHat: {
    "&$even": {
      background: theme.palette.panelBackground.commentModeratorHat,
    },
    "&$odd": {
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
      borderRadius: isFriendlyUI ? theme.borderRadius.small : 0,
    },
    position: "relative",
    backgroundImage: `linear-gradient(to bottom right, ${theme.palette.border.secondaryHighlight}, ${theme.palette.border.primaryHighlight})`,
    border: "none",
    zIndex: 0,
    '&$isAnswer': {
      backgroundImage: `linear-gradient(to bottom right, ${theme.palette.border.secondaryHighlight2}, ${theme.palette.border.primaryHighlight2})`,
    },
  },

  itsGettingNestedHere: {
    marginLeft: "7px !important",
    marginBottom: "7px !important",
  },
  soTakeOffAllYourMargins: {
    marginLeft: "6px !important",
    marginBottom: "6px !important",
  },
  imGettingSoNested: {
    marginLeft: "5px !important",
    marginBottom: "5px !important",
  },
  imGonnaDropMyMargins: {
    marginLeft: "5px !important",
    marginBottom: "5px !important",
  },
  whatAreYouEvenArguingAbout: {
    marginLeft: "4px !important",
    marginBottom: "4px !important",
  },
  areYouSureThisIsAGoodIdea: {
    marginLeft: "3px !important",
    marginBottom: "3px !important",
  },
  seriouslyWhatTheFuck: {
    marginLeft: "2px !important",
    marginBottom: "2px !important",
    transform: "rotate(.5deg)",
  },
  areYouCuriAndLumiferSpecifically: {
    marginLeft: "1px !important",
    marginBottom: "1px !important",
    transform: "rotate(1deg)",
  },
  cuzIGuessThatMakesSenseButLikeReallyTho: {
    marginLeft: "1px !important",
    marginBottom: "1px !important",
    transform: "rotate(-1deg)",
  },
}), {
  stylePriority: -1,
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
}) => {
  const { condensed, postPage, switchAlternatingHighlights } = treeOptions;
  const classes = useStyles(commentFrameStyles);
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

const nestingLevelToClass = (nestingLevel: number, classes: ClassesType<typeof commentFrameStyles["styles"]>): string => {
  return classNames(
    (nestingLevel === 1)   && classes.commentsNodeRoot,
    (nestingLevel%2 === 0) && classes.even,
    (nestingLevel%2 !== 0) && classes.odd,
    (nestingLevel > 8)  && classes.itsGettingNestedHere,
    (nestingLevel > 12) && classes.soTakeOffAllYourMargins,
    (nestingLevel > 16) && classes.imGettingSoNested,
    (nestingLevel > 20) && classes.imGonnaDropMyMargins,
    (nestingLevel > 24) && classes.whatAreYouEvenArguingAbout,
    (nestingLevel > 28) && classes.areYouSureThisIsAGoodIdea,
    (nestingLevel > 32) && classes.seriouslyWhatTheFuck,
    (nestingLevel > 36) && classes.areYouCuriAndLumiferSpecifically,
    (nestingLevel > 40) && classes.cuzIGuessThatMakesSenseButLikeReallyTho,
  );
}


export default registerComponent('CommentFrame', CommentFrame);


