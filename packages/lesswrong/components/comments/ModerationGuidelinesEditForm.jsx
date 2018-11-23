import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts'
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

class ModerationGuidelinesEditForm extends PureComponent {
  render() {
    const { postId, onClose } = this.props
    return (
      <Dialog
        modal={false}
        open={true}
        onClose={onClose}
      >
        <DialogContent>
          <Components.SmartForm
            collection={Posts}
            documentId={postId}
            fields={['moderationGuidelinesContent', 'moderationGuidelinesBody', 'moderationStyle']}
            mutationFragment={getFragment("EditModerationGuidelines")}
            successCallback={onClose}
          />
        </DialogContent>
      </Dialog>
    )
  }
}

ModerationGuidelinesEditForm.propTypes = {
  postId: PropTypes.string,
}

registerComponent('ModerationGuidelinesEditForm', ModerationGuidelinesEditForm);
