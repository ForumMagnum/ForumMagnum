/*

Display of a single message in the Conversation Wrapper

*/

import React, { PropTypes, Component } from 'react';
import { Media } from 'react-bootstrap';
import { Components, registerComponent, getDynamicComponent } from 'meteor/vulcan:core';

class MessageItem extends Component {
  render() {
    // const ContentRenderer = (props) => getDynamicComponent(import('../async/ContentRenderer.jsx'), props); Commented out for performance
    const currentUser = this.props.currentUser;
    const message = this.props.message;
    if (message.content) {
      return (
        <Media>
          {(message.user && currentUser._id != message.user._id) ? <Media.Left> <Components.UsersAvatar user={message.user}/> </Media.Left> : <div></div>}
          <Media.Body>
            {message.htmlBody && <div className="message-content-body-html" dangerouslySetInnerHTML={message.htmlBody}></div>}
            {/* <ContentRenderer state={message.content} /> Commented out for performance reasons */}
          </Media.Body>
          {(message.user && currentUser._id == message.user._id) ? <Media.Right> <Components.UsersAvatar user={currentUser}/></Media.Right> : <div></div>}
        </Media>
      )
    } else {
      return (<Components.Loading />)
    }
  }
}


registerComponent('MessageItem', MessageItem);
