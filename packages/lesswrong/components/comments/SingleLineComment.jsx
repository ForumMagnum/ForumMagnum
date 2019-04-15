import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles } from '../../themes/stylePiping'
import Tooltip from '@material-ui/core/Tooltip';

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
  }
})

const SingleLineComment = ({comment, classes}) => {
  const { voteCount, baseScore } = comment
  const { UsersName } = Components
  const { html = ""} = comment.contents || {}
  
  return <div className={classes.root}>
    <span className={classes.username}>
      <UsersName user={comment.user}/>
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
