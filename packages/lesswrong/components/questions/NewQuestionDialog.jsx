import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts/collection.js'
import Dialog from '@material-ui/core/Dialog';
import withUser from '../common/withUser';

class NewQuestionDialog extends PureComponent {
  render() {
    const { onClose, currentUser } = this.props
    return (
      <Dialog
        open={true}
        onClose={onClose}
      >
        <Components.SmartForm
          collection={Posts}
          mutationFragment={getFragment('PostsList')}
          prefilledProps={{
            userId: currentUser._id,
            question: true
          }}
          successCallback={onClose}
        />
      </Dialog>
    )
  }
}

NewQuestionDialog.propTypes = {
  currentUser: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
}

registerComponent('NewQuestionDialog', NewQuestionDialog, withUser);
