import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles, postBodyStyles } from '../../themes/stylePiping'
import withHover from '../common/withHover';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import { Comments } from '../../lib/collections/comments'
import { isMobile } from '../../lib/modules/utils/isMobile.js'

const styles = theme => ({
  root: {
    position: "relative",
    cursor: "pointer",
  },
  commentInfo: {
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
      fontWeight: theme.typography.body1.fontWeight
    }
  },
  highlight: {
    ...commentBodyStyles(theme),
    backgroundColor: "white",
    padding: theme.spacing.unit*1.5,
    width: 625,
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
    fontSize: theme.typography.body1.fontSize,
    lineHeight: theme.typography.body1.lineHeight,
    '& a, & a:hover': {
      textShadow:"none",
      color: theme.typography.body2.color,
      backgroundImage: "none"
    }
  },
  odd: {
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "#f3f3f3",
    }
  },
  expandTip: {
    textAlign: "right",
    fontSize: "1rem",
    color: theme.palette.lwTertiary.main
  }
})

const SingleLineComment = ({comment, classes, nestingLevel, hover, parentCommentId}) => {
  if (!comment) return null

  const { plaintextMainText } = comment.contents
  const { CommentBody, ShowParentComment, CommentUserName, CommentShortformIcon } = Components

  const displayHoverOver = hover && (comment.baseScore > -5) && !isMobile()

  return (
    <div className={classes.root}>
      <div className={classNames(classes.commentInfo, {[classes.isAnswer]: comment.answer, [classes.odd]:((nestingLevel%2) !== 0)})}>
        <CommentShortformIcon comment={comment} simple={true} />

        { parentCommentId!=comment.parentCommentId &&
          <ShowParentComment comment={comment} nestingLevel={nestingLevel} />
        }
        <span className={classes.karma}>
          {Comments.getKarma(comment)}
        </span>
        <span className={classes.username}>
          <CommentUserName comment={comment} simple={true}/>
        </span>
        <span className={classes.date}>
          <Components.FormatDate date={comment.postedAt} tooltip={false}/>
        </span>
        {(comment.baseScore > -5) && <span className={classes.truncatedHighlight}> {plaintextMainText} </span>}      
      </div>
      {displayHoverOver && <span className={classNames(classes.highlight)}>
        <CommentBody truncated comment={comment}/>
        <div className={classes.expandTip}>[Click to expand all comments in this thread]</div>
      </span>}
    </div>
  )
};

registerComponent('SingleLineComment', SingleLineComment, withStyles(styles, {name:"SingleLineComment"}), withHover, withErrorBoundary);
