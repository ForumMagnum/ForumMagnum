/*

Display of a single message in the Conversation Wrapper

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Media from 'react-bootstrap/lib/Media';
import { convertFromRaw } from 'draft-js';
import { Components, registerComponent, Utils } from 'meteor/vulcan:core';

class MessageItem extends Component {

  render() {
    const currentUser = this.props.currentUser;
    const message = this.props.message;

    if (message.content && !message.content.id) { //Check for ID to avoid trying to render ory-content fields (TODO: Remove or import old ory-content messages)
      // console.log(message.content);
      let htmlBody = "";
      const contentState = convertFromRaw(message.content);
      htmlBody = {__html: Utils.draftToHTML(contentState)};
      return (
        <Media>
          {(message.user && currentUser._id != message.user._id) ? <Media.Left> <Components.UsersAvatar user={message.user}/> </Media.Left> : <div></div>}
          <Media.Body>
            <div dangerouslySetInnerHTML={htmlBody}></div>
          </Media.Body>
          {(message.user && currentUser._id == message.user._id) ? <Media.Right> <Components.UsersAvatar user={currentUser}/></Media.Right> : <div></div>}
        </Media>
      )
    } else {
      return null
    }
  }

}


registerComponent('MessageItem', MessageItem);
