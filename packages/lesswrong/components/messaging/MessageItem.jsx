/*

Display of a single message in the Conversation Wrapper

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { convertFromRaw } from 'draft-js';
import { Components, registerComponent, Utils } from 'meteor/vulcan:core';
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
  }
})

class MessageItem extends Component {

  render() {
    const { currentUser, message, classes } = this.props;

    const isCurrentUser = currentUser._id == message.user._id

    if (message.content && !message.content.id) { //Check for ID to avoid trying to render ory-content fields (TODO: Remove or import old ory-content messages)
      // console.log(message.content);
      let htmlBody = "";
      const contentState = convertFromRaw(message.content);
      htmlBody = {__html: Utils.draftToHTML(contentState)};
      return (
        <div>
          <Typography variant="body2" className={classNames(classes.message, {[classes.backgroundIsCurrent]: isCurrentUser})}>
            <div className={classes.meta}>
              {message.user && <span className={classes.usersName}>
                <Components.UsersName user={message.user}/>
              </span>}
              {message.createdAt && <span className={classes.createdAt}>{moment(message.createdAt).fromNow()}</span>}
            </div>
            <div dangerouslySetInnerHTML={htmlBody}></div>
          </Typography>
        </div>
      )
    } else {
      return null
    }
  }

}


registerComponent('MessageItem', MessageItem, withStyles(styles));
