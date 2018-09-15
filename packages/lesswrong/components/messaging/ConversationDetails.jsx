/*

Component for displaying details about currently selected conversation

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, withCurrentUser } from 'meteor/vulcan:core';
import defineComponent from '../../lib/defineComponent';

const styles = theme => ({
  root: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  }
})

class ConversationDetails extends Component {

  render() {

    const { conversation, currentUser, classes} = this.props;

    if(conversation && conversation.participants.length) {
      return (
        <div className={classes.root}>
          <span>
            <Components.MetaInfo>Participants:</Components.MetaInfo>
            {conversation.participants.map((user, i) => <Components.MetaInfo key={user._id}>
              <Components.UsersName key={user._id} user={user}/>
              {/* inserts a comma for all but the last username */}
              { i < conversation.participants.length-1 && ","}
            </Components.MetaInfo>)}
          </span>
          <Components.DialogGroup title="Conversation Options"
            actions={[]} trigger={<Components.MetaInfo button>Conversation Options</Components.MetaInfo>}>
            <Components.ConversationTitleEditForm documentId={conversation._id} currentUser={currentUser} />
          </Components.DialogGroup>
        </div>
      )
    } else {
      return <Components.Loading />
    }
  }
}

export default defineComponent({
  name: 'ConversationDetails',
  component: ConversationDetails,
  styles: styles,
  hocs: [ withCurrentUser ]
});
