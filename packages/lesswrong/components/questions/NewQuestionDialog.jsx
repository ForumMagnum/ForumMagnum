import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

import { Posts } from '../../lib/collections/posts/collection.js'
import withUser from '../common/withUser';
import { withNavigation } from '../../lib/routeUtil';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
  }
})

class NewQuestionDialog extends PureComponent {
  render() {
    const { onClose, currentUser, history, flash, fullScreen, classes } = this.props
    const { PostSubmit } = Components
    const QuestionSubmit = (props) => {
      return <div className={classes.formSubmit}>
        <PostSubmit {...props} />
      </div>
    }
    return (
      <Dialog
        open={true}
        maxWidth={false}
        onClose={onClose}
        fullScreen={fullScreen}
      >
        <DialogContent>
          <Components.WrappedSmartForm
            collection={Posts}
            fields={['title', 'contents', 'question', 'draft', 'submitToFrontpage']}
            mutationFragment={getFragment('PostsList')}
            prefilledProps={{
              userId: currentUser._id,
              question: true
            }}
            cancelCallback={onClose}
            successCallback={post => {
              history.push({pathname: Posts.getPageUrl(post)});
              flash({ id: 'posts.created_message', properties: { title: post.title }, type: 'success'});
              onClose()
            }}
            formComponents={{
              FormSubmit: QuestionSubmit,
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

registerComponent('NewQuestionDialog', NewQuestionDialog, withUser, withNavigation, withMessages, withMobileDialog(), withStyles(styles, { name: "NewQuestionDialog" }))
