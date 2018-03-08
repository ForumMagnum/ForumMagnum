import { Components, registerComponent, withCurrentUser, getFragment, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from "meteor/example-forum"
import Dialog from 'material-ui/Dialog';

class NewEventFormLink extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      newEventFormOpen: false,
    }
  }

  handleOpenNewEventForm = () => {
    this.setState({
      newEventFormOpen: true,
    })
  }

  handleCloseNewEventForm = () => {
    this.setState({
      newEventFormOpen: false,
    })
  }

  render() {
    return (<div>
      <a onClick={this.handleOpenNewEventForm}> {this.props.label || "Create new local event"} </a>
      <Dialog
        contentStyle={{maxWidth:"400px"}}
        title="New Local Event Form"
        open={this.state.newEventFormOpen}
        onRequestClose={this.handleCloseNewEventForm}
        className="comments-item-text new-local-event-form"
        bodyClassName="new-local-event-form-body"
        autoScrollBodyContent
      >
        <Components.SmartForm
          collection={Posts}
          mutationFragment={getFragment('LWPostsList')}
          prefilledProps={{organizerIds: [this.props.currentUser._id], groupId: this.props.groupId}}
          successCallback={localEvent => {
            this.handleCloseNewEventForm();
            this.props.flash("Successfully created new local event " + localEvent.title);
          }}
        />
      </Dialog>
    </div>)
  }
}

registerComponent('NewEventFormLink', NewEventFormLink, withCurrentUser, withMessages);
