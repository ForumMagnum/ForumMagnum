import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles, postBodyStyles } from '../../themes/stylePiping'
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';

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
      boxShadow: "1px 1px 5px rgba(0,0,0,.35)",
      zIndex: theme.zIndexes.singleLineCommentHover,
      '& *': {
        display: "block"
      },
      '& blockquote'{
        display: "block"
      },
    }, & br, & figure, & img': {
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
    minWidth:120,
  },
  karma: {
    display:"inline-block",
    textAlign: "center",
    paddingLeft: theme.spacing.unit,
    width: 30,
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
    width: "calc(100% - 158px)",
    paddingTop: 6,
    paddingBottom: 6,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
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
  meta: {
    backgroundColor: "#f0f0f0",
    zIndex: theme.zIndexes.singleLineCommentMeta,
    position: "relative"
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
    <span className={classNames(classes.meta, {[classes.odd]:((nestingLevel%2) !== 0)})}>
      <span className={classes.karma}>
        <Tooltip title={`This comment has ${baseScore} karma (${voteCount} ${voteCount == 1 ? "Vote" : "Votes"})`} placement="bottom">
          <span>
            {baseScore || 0}
          </span>
        </Tooltip>
      </span>
      <span className={classes.username}>
        {comment.user.displayName}
      </span>
    </span>

    <span className={classNames(classes.highlight, classes.truncatedHighlight, {[classes.odd]:((nestingLevel%2) !== 0)})} dangerouslySetInnerHTML={{__html: html}} />
  </div>
};

registerComponent('SingleLineComment', SingleLineComment, withStyles(styles, {name:"SingleLineComment"}));
