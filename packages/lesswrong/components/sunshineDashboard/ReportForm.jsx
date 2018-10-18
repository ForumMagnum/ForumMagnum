import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import Reports from '../../lib/collections/reports/collection.js'
import Dialog from 'material-ui/Dialog';

class ReportForm extends Component {

  constructor(props) {
    super(props);
  }

  handleClose = () => {
    this.props.onRequestClose();
  };

  render() {
    return (
      <Dialog
        title={this.props.title}
        modal={false}
        open={true}
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
        />
      </Dialog>
    )
  }
}

ReportForm.propTypes = {
  userId: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  onRequestClose: PropTypes.func,
  title: PropTypes.string,
  postId: PropTypes.string,
  commentId: PropTypes.string,
  link: PropTypes.string,
}

registerComponent('ReportForm', ReportForm);
