import React, { Component, PropTypes } from 'react';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import Reports from '../../lib/collections/reports/collection.js'
import Dialog from 'material-ui/Dialog';

class ReportForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open: props.open,
    };
  }

  handleOpen = () => {
    this.setState({open: true});
  };

  handleClose = () => {
    this.setState({open: false});
  };

  render() {
    const currentUser = this.props.currentUser;
    return (
        <Dialog
          title={this.props.title}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          <Components.SmartForm
            collection={Reports}
            mutationFragment={getFragment('unclaimedReportsList')}
            prefilledProps={{
              userId: this.props.userId,
              postId: this.props.postId,
              commentId: this.props.commentId,
              link: this.props.link
            }}
            successCallback={this.handleClose}
          >
          </ Components.SmartForm>
        </Dialog>
      )
  }
}

ReportForm.propTypes = {
    userId: PropTypes.string.isRequired,
    documentId: PropTypes.string.isRequired,
    documentType: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired
}

registerComponent('ReportForm', ReportForm);
