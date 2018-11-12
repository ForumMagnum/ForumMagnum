import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import Reports from '../../lib/collections/reports/collection.js'
import Dialog from 'material-ui/Dialog';

class ReportForm extends PureComponent {
  render() {
    const { userId, postId, commentId, onClose, title, link } = this.props

    return (
      <Dialog
        title={title}
        modal={false}
        open={true}
        onRequestClose={onClose}
      >
        <Components.SmartForm
          collection={Reports}
          mutationFragment={getFragment('unclaimedReportsList')}
          prefilledProps={{
            userId: userId,
            postId: postId,
            commentId: commentId,
            link: link
          }}
          successCallback={onClose}
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
}

registerComponent('ReportForm', ReportForm);
