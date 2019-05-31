import { Components, registerComponent, getFragment, withMessages, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'

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
    color: theme.palette.secondary.main
  },
  cancelButton: {
    color: theme.palette.grey[400]
  }
});

const CommentsNewForm = ({prefilledProps = {}, post, parentComment, successCallback, type, cancelCallback, classes, flash, currentUser}) => {
  prefilledProps = {
    ...prefilledProps,
    postId: post._id,
    af: Comments.defaultToAlignment(currentUser, post, parentComment),
  };

  if (parentComment) {
    prefilledProps = Object.assign(prefilledProps, {
      parentCommentId: parentComment._id,
      // if parent comment has a topLevelCommentId use it; if it doesn't then it *is* the top level comment
      topLevelCommentId: parentComment.topLevelCommentId || parentComment._id
    });
  }

  const SubmitComponent = ({submitLabel = "Submit"}) => {
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
            const isAF = getSetting('forumType') === 'AlignmentForum';
            const message = (isAF
              ? "Log in or go to LessWrong to submit your comment."
              : "Log in to submit your comment."
            );
            flash({messageString: message});
            ev.preventDefault();
          }
        }}
      >
        {submitLabel}
      </Button>
    </div>
  }

  if (currentUser && !Comments.options.mutations.new.check(currentUser, prefilledProps)) {
    return <FormattedMessage id="users.cannot_comment"/>;
  }
  console.log('currentUser', currentUser)
  
  return (
    <div className={classes.root}>
      {currentUser && !currentUser.isReviewed && <div className={classes.modNote}><em>
        A moderator will need to review your account before your comments will show up.
      </em></div>}

      <Components.WrappedSmartForm
        collection={Comments}
        mutationFragment={getFragment('CommentsList')}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        prefilledProps={prefilledProps}
        layout="elementOnly"
        GroupComponent={FormGroupComponent}
        SubmitComponent={SubmitComponent}
        alignmentForumPost={post.af}
        addFields={currentUser?[]:["contents"]}
      />
    </div>
  );
};

const FormGroupComponent = (props) => {
  return <React.Fragment>
    {props.fields.map(field => (
      <Components.FormComponent
        key={field.name}
        disabled={props.disabled}
        {...field}
        errors={props.errors}
        throwError={props.throwError}
        currentValues={props.currentValues}
        updateCurrentValues={props.updateCurrentValues}
        deletedValues={props.deletedValues}
        addToDeletedValues={props.addToDeletedValues}
        clearFieldErrors={props.clearFieldErrors}
        formType={props.formType}
        currentUser={props.currentUser}
      />
    ))}
  </React.Fragment>
}



CommentsNewForm.propTypes = {
  post: PropTypes.object.isRequired,
  type: PropTypes.string, // "comment" or "reply"
  parentComment: PropTypes.object, // if reply, the comment being replied to
  topLevelCommentId: PropTypes.string, // if reply
  successCallback: PropTypes.func, // a callback to execute when the submission has been successful
  cancelCallback: PropTypes.func,
  router: PropTypes.object,
  flash: PropTypes.func,
  prefilledProps: PropTypes.object
};

registerComponent('CommentsNewForm', CommentsNewForm, withUser, withMessages, withStyles(styles), withErrorBoundary);
