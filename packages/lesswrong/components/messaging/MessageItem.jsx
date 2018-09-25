/*

Display of a single message in the Conversation Wrapper

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import classNames from 'classnames';
import moment from 'moment';

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
  usersName: {
    marginBottom: theme.spacing.unit/2,
  },
  meta: {
    opacity:.75,
    marginBottom:theme.spacing.unit
  },
  createdAt: {
    marginLeft: theme.spacing.unit
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

    const isCurrentUser = currentUser._id == message.user._id

    if (message.htmlBody) {
      const htmlBody = {__html: message.htmlBody};
      return (
        <div>
          <Typography variant="body2" className={classNames(classes.message, {[classes.backgroundIsCurrent]: isCurrentUser})}>
            <div className={classes.meta}>
              {message.user && <span className={classes.usersName}>
                <Components.UsersName user={message.user}/>
              </span>}
              {message.createdAt && <span className={classes.createdAt}>{moment(message.createdAt).fromNow()}</span>}
            </div>
            <div dangerouslySetInnerHTML={htmlBody} className={classes.messageBody}></div>
          </Typography>
        </div>
      )
    } else {
      return null
    }
  }

}


registerComponent('MessageItem', MessageItem, withStyles(styles, { name: "MessageItem" }));
