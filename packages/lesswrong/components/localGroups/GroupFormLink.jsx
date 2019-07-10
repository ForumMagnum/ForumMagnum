import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import classNames from "classnames";
import { withRouter } from '../../lib/reactRouterWrapper.js'
import withUser from '../common/withUser';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import AddLocationIcon from '@material-ui/icons/AddLocation';

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
    const { documentId } =  this.props
    const { WrappedSmartForm, SectionButton } = Components
    return (<React.Fragment>
      { documentId ? 
        <SectionButton>
          <span onClick={this.handleOpenGroupForm}>Edit Group</span>
        </SectionButton> 
        : 
        <SectionButton>
          <AddLocationIcon />
          <span onClick={this.handleOpenGroupForm}>New Group</span>
        </SectionButton>
      }
      <Dialog
        open={this.state.groupFormOpen}
        onClose={this.handleCloseGroupForm}
      >
        <DialogContent className="local-group-form">
          <WrappedSmartForm
            collection={Localgroups}
            documentId={this.props.documentId}
            queryFragment={getFragment('localGroupsEdit')}
            mutationFragment={getFragment('localGroupsHomeFragment')}
            prefilledProps={this.props.documentId ? {} : {organizerIds: [this.props.currentUser._id]}} // If edit form, do not prefill organizerIds
            successCallback={group => {
              this.handleCloseGroupForm();
              if (this.props.documentId) {
                this.props.flash({messageString: "Successfully edited local group " + group.name});
              } else {
                this.props.flash({messageString: "Successfully created new local group " + group.name})
                this.props.router.push({pathname: '/groups/' + group._id});
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </React.Fragment>)
  }
}

registerComponent('GroupFormLink', GroupFormLink, withUser, withMessages, withRouter);
