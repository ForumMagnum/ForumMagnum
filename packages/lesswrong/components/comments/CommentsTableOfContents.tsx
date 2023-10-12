import React, { useContext, useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentPoolContext } from './CommentPool';
import RangeSlider from 'react-range-slider-input';
import { CommentTreeNode } from '../../lib/utils/unflatten';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.text.dim,

    // Styles copied from react-range-slider-input library
    "& .range-slider": {
      touchAction: "none",
      "-webkit-tap-highlight-color": "transparent",
      "-webkit-user-select": "none",
      userSelect: "none",
      cursor: "pointer",
      display: "block",
      position: "relative",
      width: "100%",
      height: 8,
      background: "#ddd",
      borderRadius: 4,
    },
    "& .range-slider[data-vertical]": {
      height: "100%",
      width: 8,
    },
    "& .range-slider[data-disabled]": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    "& .range-slider .range-slider__thumb": {
      position: "absolute",
      zIndex: 3,
      top: "50%",
      width: 16,
      height: 16,
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      background: "#bbb",
    },
    "& .range-slider .range-slider__thumb:focus-visible": {
      outline: 0,
      boxShadow: "0 0 0 6px rgba(33, 150, 243, 0.5)",
    },
    "& .range-slider[data-vertical] .range-slider__thumb": {
      left: "50%",
    },
    "& .range-slider .range-slider__thumb[data-disabled]": {
      zIndex: 2,
    },
    "& .range-slider .range-slider__range": {
      position: "absolute",
      zIndex: 1,
      transform: "translate(0, -50%)",
      top: "50%",
      width: "100%",
      height: "100%",
      background: "#bbb",
    },
    "& .range-slider[data-vertical] .range-slider__range": {
      left: "50%",
      transform: "translate(-50%, 0)",
    },
    "& .range-slider input[type=\"range\"]": {
      "-webkit-appearance": "none",
      pointerEvents: "none",
      position: "absolute",
      zIndex: 2,
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      backgroundColor: "transparent",
    },
    "& .range-slider input[type=\"range\"]::-webkit-slider-thumb": {
      "-webkit-appearance": "none",
      appearance: "none",
    },
    "& .range-slider input[type=\"range\"]::-moz-range-thumb": {
      width: 0,
      height: 0,
      border: 0,
    },
    "& .range-slider input[type=\"range\"]:focus": {
      outline: 0,
    },
  },
  rangeSliderWrapper: {
    margin: 8,
  },
  rangeSliderLabel: {
    ...theme.typography.body2,
    color: theme.palette.text.dim,
    display: "flex",
    marginTop: 16,
  },
  left: {
    flexGrow: 1,
  },
  right: {
  },
  comment: {
    display: "inline-flex",
  },
  commentKarma: {
    width: 20,
  },
  commentAuthor: {
  },
})

const CommentsTableOfContents = ({commentTree, highlightedSection, classes}: {
  commentTree?: CommentTreeNode<CommentsList>[],
  highlightedSection: string|null,
  classes: ClassesType,
}) => {
  const commentPoolContext = useContext(CommentPoolContext);
  
  const bottomOfRange = -10, topOfRange = 100;
  const [karmaRange,setKarmaRange] = useState<[number,number]>([10,topOfRange]);
  const [minExpandedKarma,maxExpandedKarma] = karmaRange;
  
  let expandedKarmaStr: string
  if (minExpandedKarma===bottomOfRange && maxExpandedKarma===topOfRange)
    expandedKarmaStr = "All"
  else if (minExpandedKarma===bottomOfRange)
    expandedKarmaStr = "≤"+maxExpandedKarma
  else if (maxExpandedKarma===topOfRange)
    expandedKarmaStr = "≥"+minExpandedKarma
  else
    expandedKarmaStr = `${minExpandedKarma}-${maxExpandedKarma}`;


  return <div className={classes.root}>
    {commentTree && commentTree.map(comment => comment.item
      ? <ToCCommentBlock
        commentTree={comment} indentLevel={1} classes={classes}
        highlightedSection={highlightedSection}
      />
      : null
    )}

    <div className={classes.rangeSliderLabel}>
      <div className={classes.left}>
        Expand comments with karma
      </div>
      <div className={classes.right}>
        {expandedKarmaStr}
      </div>
    </div>
    <div className={classes.rangeSliderWrapper}>
      <RangeSlider
        value={karmaRange}
        onInput={setKarmaRange}
        min={bottomOfRange}
        max={topOfRange}
      />
    </div>
  </div>
}

const ToCCommentBlock = ({commentTree, indentLevel, highlightedSection, classes}: {
  commentTree: CommentTreeNode<CommentsList>,
  indentLevel: number,
  highlightedSection: string|null,
  classes: ClassesType,
}) => {
  const { TableOfContentsRow } = Components;
  const comment = commentTree.item!;
  return <div>
    <TableOfContentsRow
      indentLevel={indentLevel}
      highlighted={highlightedSection===comment._id}
      dense
      href={"#"+comment._id}
    >
      <span className={classes.comment}>
        <span className={classes.commentKarma}>{comment.baseScore}</span>
        <span className={classes.commentAuthor}>{comment.user?.displayName}</span>
      </span>
    </TableOfContentsRow>
    
    {commentTree.children.map(child =>
      <ToCCommentBlock
        key={child._id}
        highlightedSection={highlightedSection}
        commentTree={child} indentLevel={indentLevel+1} classes={classes}
      />
    )}
  </div>
}

const CommentsTableOfContentsComponent = registerComponent('CommentsTableOfContents', CommentsTableOfContents, {styles});

declare global {
  interface ComponentTypes {
    CommentsTableOfContents: typeof CommentsTableOfContentsComponent
  }
}

