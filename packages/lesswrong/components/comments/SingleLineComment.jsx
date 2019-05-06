import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles, postBodyStyles } from '../../themes/stylePiping'
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    cursor: "pointer",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    ...commentBodyStyles(theme),
    marginBottom: 6,
    marginTop: 6,
    color: "rgba(0,0,0,.6)",
    paddingRight: theme.spacing.unit*2
  },
  karma: {
    display:"inline-block",
    textAlign: "center",
    paddingRight: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit
  },
  username: {
    display:"inline-block",
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit,
    '& a, & a:hover': {
      color: "rgba(0,0,0,.87)",
    },
    fontWeight: 600,
  },
  truncatedHighlight: {
    '& *': {
      display: "inline"
    },
    '& blockquote, & br, & figure, & img': {
      display: "none"
    },
    '& p': {
      marginLeft: 6
    },
    '& strong': {
      fontWeight: theme.typography.body2.fontWeight
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
  }
})

const SingleLineComment = ({comment, classes}) => {
  const { voteCount, baseScore } = comment
  const { UsersName } = Components
  const { html = ""} = comment.contents || {}
  
  return <div className={classNames(classes.root, {[classes.isAnswer]: comment.answer})}>
    <span className={classes.username}>
      {comment.answer && <span>Answer by </span>}<UsersName user={comment.user}/>
    </span>
    <Tooltip title={`This comment has ${baseScore} karma (${voteCount} ${voteCount == 1 ? "Vote" : "Votes"})`} placement="bottom">
      <span className={classes.karma}>
        {baseScore || 0}
      </span>
    </Tooltip>
    {(baseScore > -5) && <span className={classes.truncatedHighlight} dangerouslySetInnerHTML={{__html:html}} />}
  </div>
};

registerComponent('SingleLineComment', SingleLineComment, withStyles(styles, {name:"SingleLineComment"}));
