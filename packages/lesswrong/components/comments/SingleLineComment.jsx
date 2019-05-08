import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles, postBodyStyles } from '../../themes/stylePiping'
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import { truncate } from '../../lib/editor/ellipsize'

const styles = theme => ({
  root: {
    cursor: "pointer",
    ...commentBodyStyles(theme),
    color: "rgba(0,0,0,.6)",
    paddingRight: theme.spacing.unit,
    position: "relative",
    marginTop: 0,
    marginBottom: 0,
    '&:hover $highlight': {
      whiteSpace: "unset",
      backgroundColor: "#f0f0f0",
      border: "solid 1px #aaa",
      zIndex: 1,
      '& *': {
        display: "block"
      },
      '& blockquote, & br, & figure, & img': {
        display: "block"
      },
      '& p': {
        marginRight: 0
      },
      '& strong': {
        fontWeight: 600
      }
    },
  },
  username: {
    paddingTop: 6,
    paddingBottom: 6,
    display:"inline-block",
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    '& a, & a:hover': {
      color: "rgba(0,0,0,.87)",
    },
    fontWeight: 600,
  },
  karma: {
    display:"inline-block",
    textAlign: "left",
    paddingLeft: theme.spacing.unit*2,
    width:100,
    paddingTop: 6,
    paddingBottom: 6,
  },
  truncatedHighlight: {
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
    position: "absolute",
    right: 0,
    maxWidth: 600,
    paddingTop: 6,
    paddingBottom: 6,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    marginRight: -1,
    marginTop: -1,
    borderTop: "solid 1px #ddd",
    borderRight: "solid 1px #ddd",
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
  }
})

const SingleLineComment = ({comment, classes, nestingLevel}) => {
  const { voteCount, baseScore } = comment
  const { UsersName } = Components
  const { html = ""} = comment.contents || {}
  
  return <div className={classNames(classes.root, {[classes.isAnswer]: comment.answer})}>
    <span className={classes.username}>
      {comment.answer && <span>Answer by </span>}<UsersName user={comment.user}/>
    </span>
    <span className={classes.karma}>
      <Tooltip title={`This comment has ${baseScore} karma (${voteCount} ${voteCount == 1 ? "Vote" : "Votes"})`} placement="bottom">
        <span>
          {baseScore || 0}
        </span>
      </Tooltip>
    </span>

    <span className={classNames(classes.highlight, classes.truncatedHighlight, {[classes.odd]:((nestingLevel%2) !== 0)})} dangerouslySetInnerHTML={{__html:truncate(comment, 500, " (Click to expand Thread more)")}} />
  </div>
};

registerComponent('SingleLineComment', SingleLineComment, withStyles(styles, {name:"SingleLineComment"}));
