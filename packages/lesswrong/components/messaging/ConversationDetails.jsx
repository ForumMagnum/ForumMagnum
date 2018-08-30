/*

Component for displaying details about currently selected conversation

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginLeft: theme.spacing.unit/2,
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    display: "flex",
    justifyContent: "space-between"
  }
})

class ConversationDetails extends Component {

  render() {

    const { conversation, currentUser, classes} = this.props;

    if(conversation && conversation.participants.length) {
      return (
        <div className={classes.root}>
          <span>
            {conversation.participants.map((user, i) => <Components.MetaInfo key={user._id}>
              <Components.UsersName key={user._id} user={user}/>
              {/* inserts a comma for all but the last username */}
              { i < conversation.participants.length-1 && ","}
            </Components.MetaInfo>)}
          </span>
          <Components.DialogGroup title="Edit Conversation Title"
            actions={[]} trigger={<Components.MetaInfo button>Edit Title</Components.MetaInfo>}>
            <Components.ConversationTitleEditForm documentId={conversation._id} currentUser={currentUser} />
          </Components.DialogGroup>
        </div>
      )
    } else {
      return <Components.Loading />
    }
  }
}

registerComponent('ConversationDetails', ConversationDetails, withCurrentUser, withStyles(styles));
