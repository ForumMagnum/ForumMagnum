import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import type { CommentTreeOptions } from './commentTree';
import classNames from 'classnames';

export const HIGHLIGHT_DURATION = 3

export const CONDENSED_MARGIN_BOTTOM = 4

const styles = (theme: ThemeType): JssStyles => ({
  node: {
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
    cursor: "default",
    // Higher specificity to override child class (variant syntax)
    '&$deleted': {
      opacity: 0.6
    }
  },
  commentsNodeRoot: {
    borderRadius: 3,
  },
  child: {
    marginLeft: theme.spacing.unit,
    marginBottom: 6,
    borderLeft: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderTop: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderBottom: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderRight: "none",
    borderRadius: "2px 0 0 2px"
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
    border: `solid 2px ${theme.palette.commentBorderGrey}`,
  },
  answerChildComment: {
    marginBottom: theme.spacing.unit,
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
  },
  childAnswerComment: {
    borderRight: "none"
  },
  oddAnswerComment: {
    backgroundColor: 'white'
  },
  answerLeafComment: {
    paddingBottom: 0
  },
  isSingleLine: {
    marginBottom: 0,
    borderBottom: "none",
    borderTop: `solid 1px ${theme.palette.commentBorderGrey}`,
    '&.comments-node-root':{
      marginBottom: CONDENSED_MARGIN_BOTTOM,
      borderBottom: `solid 1px ${theme.palette.commentBorderGrey}`,
    }
  },
  condensed: {
    '&.comments-node-root':{
      marginBottom: CONDENSED_MARGIN_BOTTOM,
    }
  },
  shortformTop: {
    '&&': {
      marginTop: theme.spacing.unit*4,
      marginBottom: 0
    }
  },
  hoverPreview: {
    marginBottom: 0
  },
  moderatorHat: {
    "&.comments-node-even": {
      background: "#5f9b651c",
    },
    "&.comments-node-odd": {
      background: "#5f9b651c",
    },
  },
  '@keyframes higlight-animation': {
    from: {
      backgroundColor: theme.palette.grey[300],
      borderColor: "black"
    },
    to: {
      backgroundColor: "none",
      borderColor: "rgba(0,0,0,.15)"
    }
  },
  highlightAnimation: {
    animation: `higlight-animation ${HIGHLIGHT_DURATION}s ease-in-out 0s;`
  },
  promoted: {
    border: `solid 1px ${theme.palette.lwTertiary.main}`,
  }
});

const CommentFrame = ({comment, treeOptions, onClick, id, nestingLevel, hasChildren, highlighted, isSingleLine, isChild, isNewComment, isReplyToAnswer, hoverPreview, shortform, children, classes}: {
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
  
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  const { condensed, postPage } = treeOptions;
  
  const nodeClass = classNames(
    "comments-node",
    nestingLevelToClass(nestingLevel, classes),
    classes.node,
    {
      "af":comment.af,
      [classes.highlightAnimation]: highlighted,
      [classes.child]: isChild,
      [classes.new]: isNewComment,
      [classes.deleted]: comment.deleted,
      [classes.isAnswer]: comment.answer,
      [classes.answerChildComment]: isReplyToAnswer,
      [classes.childAnswerComment]: isChild && isReplyToAnswer,
      [classes.oddAnswerComment]: (nestingLevel % 2 !== 0) && isReplyToAnswer,
      [classes.answerLeafComment]: !hasChildren,
      [classes.isSingleLine]: isSingleLine,
      [classes.condensed]: condensed,
      [classes.shortformTop]: postPage && shortform && (nestingLevel===1),
      [classes.hoverPreview]: hoverPreview,
      [classes.moderatorHat]: comment.moderatorHat,
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


const CommentFrameComponent = registerComponent('CommentFrame', CommentFrame, {styles});

declare global {
  interface ComponentTypes {
    CommentFrame: typeof CommentFrameComponent,
  }
}

