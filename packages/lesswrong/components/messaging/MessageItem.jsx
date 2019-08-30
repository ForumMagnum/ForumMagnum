/*

Display of a single message in the Conversation Wrapper

*/

import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = theme => ({
  message: {
    backgroundColor: grey[200],
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    borderRadius:5,
    marginBottom:theme.spacing.unit*1.5,
    wordWrap: "break-word"
  },
  backgroundIsCurrent: {
    backgroundColor: grey[700],
    color: "white",
    marginLeft:theme.spacing.unit*1.5,
  },
  meta: {
    marginBottom:theme.spacing.unit*1.5
  },
  whiteMeta: {
    color: 'rgba(255,255,255, 0.7)'
  },
  messageBody: {
    '& a': {
      color: theme.palette.primary.light
    }
  }
})

const MessageItem = ({currentUser, message, classes}) => {
  const { html = "" } = message?.contents || {}
  if (!message) return null;
  if (!html) return null
  
  const isCurrentUser = (currentUser && message.user) && currentUser._id === message.user._id
  const htmlBody = {__html: html};
  const colorClassName = classNames({[classes.whiteMeta]: isCurrentUser})
  
  return (
    <Typography variant="body1" className={classNames(classes.message, {[classes.backgroundIsCurrent]: isCurrentUser})}>
      <div className={classes.meta}>
        {message.user && <Components.MetaInfo>
          <span className={colorClassName}><Components.UsersName user={message.user}/></span>
        </Components.MetaInfo>}
        {message.createdAt && <Components.MetaInfo>
          <span className={colorClassName}><Components.FormatDate date={message.createdAt}/></span>
        </Components.MetaInfo>}
      </div>
      <Components.ContentItemBody dangerouslySetInnerHTML={htmlBody} className={classes.messageBody} />
    </Typography>
  )
}


registerComponent('MessageItem', MessageItem, withStyles(styles, { name: "MessageItem" }), withErrorBoundary);
