/*

Display of a single message in the Conversation Wrapper

*/

import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import classNames from 'classnames';

const styles = theme => ({
  message: {
    backgroundColor: grey[200],
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    borderRadius:5,
    marginBottom:theme.spacing.unit*1.5,
  },
  backgroundIsCurrent: {
    backgroundColor: grey[700],
    color: "white",
    marginLeft:theme.spacing.unit*1.5,
  },
  meta: {
    marginBottom:theme.spacing.unit*1.5
  },
  messageBody: {
    '& a': {
      color: theme.palette.primary.light
    }
  }
})

class MessageItem extends Component {

  render() {
    const { currentUser, message, classes } = this.props;
    if (!message) return null;
    const isCurrentUser = (currentUser && message.user) && currentUser._id == message.user._id
    const { html = "" } = message.contents || {}
    if (html) {
      const htmlBody = {__html: html};
      return (
        <Components.ErrorBoundary>
          <Typography variant="body2" className={classNames(classes.message, {[classes.backgroundIsCurrent]: isCurrentUser})}>
            <div className={classes.meta}>
              {message.user && <Components.MetaInfo>
                <Components.UsersName user={message.user}/>
              </Components.MetaInfo>}
              {message.createdAt && <Components.MetaInfo>
                <Components.FormatDate date={message.createdAt}/>
              </Components.MetaInfo>}
            </div>
            <div dangerouslySetInnerHTML={htmlBody} className={classes.messageBody}></div>
          </Typography>
        </Components.ErrorBoundary>
      )
    } else {
      return null
    }
  }

}


registerComponent('MessageItem', MessageItem, withStyles(styles, { name: "MessageItem" }));
