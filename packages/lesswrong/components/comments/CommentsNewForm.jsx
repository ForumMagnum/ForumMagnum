import { Components, registerComponent, getFragment, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import withDialog from '../common/withDialog';

const styles = theme => ({
  root: {
  },
  modNote: {
    paddingTop: '4px',
    color: theme.palette.grey[800]
  },
  submit: {
    textAlign: 'right'
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: "rgba(0,0,0, 0.05)",
    },
    color: theme.palette.lwTertiary.main
  },
  cancelButton: {
    color: theme.palette.grey[400]
  }
});

const CommentsNewForm = ({prefilledProps = {}, post, parentComment, successCallback, type, cancelCallback, classes, currentUser, fragment = "CommentsList"}) => {
  prefilledProps = {
    ...prefilledProps,
    af: Comments.defaultToAlignment(currentUser, post, parentComment),
  };
  
  if (post) {
    prefilledProps = {
      ...prefilledProps,
      postId: post._id
    };
  }

  if (parentComment) {
    prefilledProps = {
      ...prefilledProps,
      parentCommentId: parentComment._id,
    };
  }

  const SubmitComponent = withDialog(({submitLabel = "Submit", openDialog}) => {
    return <div className={classes.submit}>
      {(type === "reply") && <Button
        onClick={cancelCallback}
        className={classNames(classes.formButton, classes.cancelButton)}
      >
        Cancel
      </Button>}
      <Button
        type="submit"
        className={classNames(classes.formButton)}
        onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {}
            });
            ev.preventDefault();
          }
        }}
      >
        {submitLabel}
      </Button>
    </div>
  });

  if (currentUser && !Comments.options.mutations.new.check(currentUser, prefilledProps)) {
    return <FormattedMessage id="users.cannot_comment"/>;
  }

  const commentWillBeHidden = getSetting('hideUnreviewedAuthorComments') && currentUser && !currentUser.isReviewed

  return (
    <div className={classes.root}>
      {commentWillBeHidden && <div className={classes.modNote}><em>
        A moderator will need to review your account before your comments will show up.
      </em></div>}

      <Components.WrappedSmartForm
        collection={Comments}
        mutationFragment={getFragment(fragment)}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        prefilledProps={prefilledProps}
        layout="elementOnly"
        formComponents={{
          FormSubmit: SubmitComponent,
          FormGroupLayout: Components.DefaultStyleFormGroup
        }}
        alignmentForumPost={post?.af}
        addFields={currentUser?[]:["contents"]}
      />
    </div>
  );
};




CommentsNewForm.propTypes = {
  post: PropTypes.object,
  type: PropTypes.string, // "comment" or "reply"
  parentComment: PropTypes.object, // if reply, the comment being replied to
  successCallback: PropTypes.func, // a callback to execute when the submission has been successful
  cancelCallback: PropTypes.func,
  prefilledProps: PropTypes.object
};

registerComponent('CommentsNewForm', CommentsNewForm, withUser, withStyles(styles), withErrorBoundary);
