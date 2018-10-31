import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

import { Posts } from '../../lib/collections/posts/collection.js'
import withUser from '../common/withUser';

class NewQuestionDialog extends PureComponent {
  render() {
    const { onClose, currentUser } = this.props
    return (
      <Dialog
        open={true}
        onClose={onClose}
      >
        <DialogContent>
          <Components.SmartForm
            collection={Posts}
            fields={['title', 'content', 'question']}
            mutationFragment={getFragment('EditQuestion')}
            prefilledProps={{
              userId: currentUser._id,
              question: true
            }}
            successCallback={onClose}
          />
        </DialogContent>
      </Dialog>
    )
  }
}

NewQuestionDialog.propTypes = {
  currentUser: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
}

registerComponent('NewQuestionDialog', NewQuestionDialog, withUser)
