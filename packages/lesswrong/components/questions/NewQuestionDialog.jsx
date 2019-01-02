import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

import { Posts } from '../../lib/collections/posts/collection.js'
import withUser from '../common/withUser';
import { withRouter } from 'react-router';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import classNames from 'classnames'

const styles = theme => ({
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: "rgba(0,0,0, 0.05)",
    },
    color: theme.palette.secondary.main
  },
  submit: {
    display: 'flex',
    justifyContent: 'space-between',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'initial'
    }
  },
  secondaryButton: {
    color: theme.palette.grey[400]
  },
});

class NewQuestionDialog extends PureComponent {
  render() {
    const { onClose, currentUser, router, flash, fullScreen, classes } = this.props
    const SubmitComponent = ({submitLabel = "Submit"}, context) => {
      return <div className={classes.submit}>
        <Button
          onClick={onClose}
          className={classNames(classes.formButton, classes.secondaryButton)}
        >
          Cancel
        </Button>
        <div>
        <Button
            type="submit"
            className={classNames(classes.formButton, classes.secondaryButton, classes.rightAlign)}
            onClick={() => context.updateCurrentValues({draft: true})}
          >
            Save as draft
          </Button>
          <Button
            type="submit"
            className={classNames(classes.formButton, classes.rightAlign)}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    }
    SubmitComponent.contextTypes = {
      updateCurrentValues: PropTypes.func,
    }
    return (
      <Dialog
        open={true}
        onClose={onClose}
        fullScreen={fullScreen}
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
            SubmitComponent={SubmitComponent}
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

registerComponent('NewQuestionDialog', NewQuestionDialog, withUser, withRouter, withMessages, withMobileDialog(), withStyles(styles))
