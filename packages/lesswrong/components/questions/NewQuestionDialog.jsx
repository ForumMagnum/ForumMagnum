import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

import { Posts } from '../../lib/collections/posts/collection.js'
import withUser from '../common/withUser';
import { withRouter } from 'react-router';

class NewQuestionDialog extends PureComponent {
  render() {
    const { onClose, currentUser, router, flash } = this.props
    return (
      <Dialog
        open={true}
        onClose={onClose}
      >
        <DialogContent>
          <Components.SmartForm
            collection={Posts}
            fields={['title', 'content', 'question', 'draft']}
            mutationFragment={getFragment('PostsList')}
            prefilledProps={{
              userId: currentUser._id,
              question: true
            }}
            successCallback={post => {
              router.push({pathname: Posts.getPageUrl(post)});
              flash({ id: 'posts.created_message', properties: { title: post.title }, type: 'success'});
              onClose()
            }}
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

registerComponent('NewQuestionDialog', NewQuestionDialog, withUser, withRouter, withMessages)
