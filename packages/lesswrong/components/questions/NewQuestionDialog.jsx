import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts/collection.js'
import Dialog from '@material-ui/core/Dialog';
import withUser from '../common/withUser';

class NewQuestionDialog extends PureComponent {
  render() {
    const { onRequestClose, currentUser } = this.props
    return (
      <Dialog
        open={true}
        onClose={onRequestClose}
      >
        <Components.SmartForm
          collection={Posts}
          mutationFragment={getFragment('PostsList')}
          prefilledProps={{
            userId: currentUser._id,
            question: true
          }}
          successCallback={onRequestClose}
        />
      </Dialog>
    )
  }
}

// .then(() => flash({messageString: "Successfully restored comment", type: "success"})).catch(/* error */);

NewQuestionDialog.propTypes = {
  currentUser: PropTypes.object.isRequired,
  onRequestClose: PropTypes.func,
}

registerComponent('NewQuestionDialog', NewQuestionDialog, withUser);
