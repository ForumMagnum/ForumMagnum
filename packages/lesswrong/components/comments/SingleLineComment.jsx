import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles, postBodyStyles } from '../../themes/stylePiping'
import withHover from '../common/withHover';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import Icon from '@material-ui/core/Icon';

const styles = theme => ({
  root: {
    position: "relative"
  },
  commentInfo: {
    cursor: "pointer",
    backgroundColor: "#f0f0f0",
    ...commentBodyStyles(theme),
    color: "rgba(0,0,0,.6)",
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    marginTop: 0,
    marginBottom: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingTop: 6,
    paddingBottom: 6,
  },
  username: {
    display:"inline-block",
    paddingRight: theme.spacing.unit,
    '& a, & a:hover': {
      color: "rgba(0,0,0,.87)",
    },
    fontWeight: 600,
  },
  karma: {
    display:"inline-block",
    textAlign: "center",
    paddingRight: theme.spacing.unit,
    width: 30,
  },
  truncatedHighlight: {
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
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
    backgroundColor: "#f0f0f0",
    padding: theme.spacing.unit*1.5,
    width: 625,
    position: "absolute",
    top: "calc(100% - 20px)",
    right: 0,
    zIndex: 5,
    boxShadow: "0 0 10px rgba(0,0,0,.2)",
    maxHeight: 500,
    overflow: "hidden",
    '& img': {
      maxHeight: "200px"
    }
  },
  isAnswer: {
    ...postBodyStyles(theme),
    marginTop: 9,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    '& a, & a:hover': {
      textShadow:"none",
      color: theme.typography.body1.color,
      backgroundImage: "none"
    }
  },
  odd: {
    backgroundColor: "white !important"
  },
})

const SingleLineComment = ({comment, classes, nestingLevel, hover, anchorEl}) => {
  const { voteCount, baseScore } = comment
  const { CommentBody, ShowParentComment } = Components
  const { html = ""} = comment.contents || {}

  return (
    <div className={classes.root}>
      <div className={classNames(classes.commentInfo, {[classes.isAnswer]: comment.answer, [classes.odd]:((nestingLevel%2) !== 0)})}>
        <ShowParentComment comment={comment} nestingLevel={nestingLevel} />
        <Tooltip title={`This comment has ${baseScore} karma (${voteCount} ${voteCount == 1 ? "Vote" : "Votes"})`} placement="bottom">
          <span className={classes.karma}>

            {baseScore || 0}
          </span>
        </Tooltip>
        <span className={classes.username}>
          {comment.user.displayName}
        </span>
        <span className={classNames(classes.truncatedHighlight, {[classes.odd]:((nestingLevel%2) !== 0)})} dangerouslySetInnerHTML={{__html: html}} />
      </div>
      {hover && <span className={classNames(classes.highlight, {[classes.odd]:((nestingLevel%2) !== 0)})}>
        <CommentBody truncated comment={comment}/>
      </span>}
    </div>
  )
};

registerComponent('SingleLineComment', SingleLineComment, withStyles(styles, {name:"SingleLineComment"}), withHover);
