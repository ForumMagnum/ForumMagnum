import { Components, withCurrentUser, getFragment, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import Dialog from 'material-ui/Dialog';
import classNames from "classnames";
import { withRouter } from 'react-router'
import defineComponent from '../../lib/defineComponent';

class GroupFormLink extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      groupFormOpen: false,
    }
  }

  handleOpenGroupForm = () => {
    this.setState({
      groupFormOpen: true,
    })
  }

  handleCloseGroupForm = () => {
    this.setState({
      groupFormOpen: false,
    })
  }

  render() {
    const dialogClasses = classNames(
      "comments-item-text",
      "local-group-form",
      {
        "local-group-new-form": this.props.documentId,
        "local-group-edit-form": !this.props.documentId
      }
    )
    const labelText = this.props.label || (this.props.documentId ? "Edit group" : "Create new local group");
    return (<div>
      <Components.SectionSubtitle>
        <span onClick={this.handleOpenGroupForm}>{labelText}</span>
      </Components.SectionSubtitle>
      <Dialog
        contentStyle={{maxWidth:"500px"}}
        open={this.state.groupFormOpen}
        onRequestClose={this.handleCloseGroupForm}
        className={dialogClasses}
        bodyClassName="local-group-form-body"
        autoScrollBodyContent
      >
        <Components.SmartForm
          collection={Localgroups}
          documentId={this.props.documentId}
          mutationFragment={getFragment('localGroupsHomeFragment')}
          prefilledProps={this.props.documentId ? {} : {organizerIds: [this.props.currentUser._id]}} // If edit form, do not prefill organizerIds
          successCallback={group => {
            this.handleCloseGroupForm();
            if (this.props.documentId) {
              this.props.flash("Successfully edited local group " + group.name);
            } else {
              this.props.flash("Successfully created new local group " + group.name)
              this.props.router.push({pathname: '/groups/' + group._id});
            }
          }}
        />
      </Dialog>
    </div>)
  }
}

export default defineComponent({
  name: 'GroupFormLink',
  component: GroupFormLink,
  hocs: [ withCurrentUser, withMessages, withRouter ]
});
