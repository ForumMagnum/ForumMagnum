import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import AddLocationIcon from '@material-ui/icons/AddLocation';
import withDialog from '../common/withDialog'

class GroupFormLink extends Component {
  handleOpenGroupForm = () => {
    this.props.openDialog({
      componentName: "GroupFormDialog",
      componentProps: {documentId: this.props.documentId}
    })
  }

  render() {
    const { documentId } =  this.props
    const { SectionButton } = Components
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
    </React.Fragment>)
  }
}

registerComponent('GroupFormLink', GroupFormLink, withDialog);
