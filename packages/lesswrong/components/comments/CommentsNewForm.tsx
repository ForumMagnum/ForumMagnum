import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { Comments } from '../../lib/collections/comments';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import { useDialog } from '../common/withDialog';
import { hideUnreviewedAuthorCommentsSettings } from '../../lib/publicSettings';
import Users from '../../lib/collections/users/collection';

const styles = theme => ({
  root: {
  },
  loadingRoot: {
    opacity: 0.5
  },
  form: {
    padding: 10,
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
      opacity: .5,
      background: "none"
    },
    color: theme.palette.lwTertiary.main
  },
  cancelButton: {
    color: theme.palette.grey[400]
  },
  moderationGuidelinesWrapper: {
    backgroundColor: "rgba(0,0,0,.07)",
  }
});

const CommentsNewForm = ({prefilledProps = {}, post, tag, parentComment, successCallback, type, cancelCallback, classes, removeFields, fragment = "CommentsList", formProps, enableGuidelines=true, padding=true}:
{
  prefilledProps?: any,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  parentComment?: any,
  successCallback?: any,
  type: string,
  cancelCallback?: any,
  classes: ClassesType,
  removeFields?: any,
  fragment?: string,
  formProps?: any,
  enableGuidelines?: boolean,
  padding?: boolean
}) => {
  const currentUser = useCurrentUser();
  prefilledProps = {
    ...prefilledProps,
    af: Comments.defaultToAlignment(currentUser, post, parentComment),
  };
  
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [loading, setLoading] = useState(false)
  const { ModerationGuidelinesBox, WrappedSmartForm, RecaptchaWarning, Loading } = Components

  const wrappedSuccessCallback = (...args) => {
    if (successCallback) {
      successCallback(...args)
    }
    setLoading(false)
  };

  const wrappedCancelCallback = (...args) => {
    if (cancelCallback) {
      cancelCallback(...args)
    }
    setLoading(false)
  };
  
  if (post) {
    prefilledProps = {
      ...prefilledProps,
      postId: post._id
    };
  }
  
  if (tag) {
    prefilledProps = {
      ...prefilledProps,
      tagId: tag._id
    };
  }

  if (parentComment) {
    prefilledProps = {
      ...prefilledProps,
      parentCommentId: parentComment._id,
    };
  }

  const SubmitComponent = ({submitLabel = "Submit"}) => {
    const { openDialog } = useDialog();
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
        {loading ? <Loading /> : submitLabel}
      </Button>
    </div>
  };

  if (currentUser && !Users.canDo(currentUser, `posts.moderate.all`) && !Users.isAllowedToComment(currentUser, prefilledProps)) {
    return <span>Sorry, you do not have permission to comment at this time.</span>
  }

  const commentWillBeHidden = hideUnreviewedAuthorCommentsSettings.get() && currentUser && !currentUser.isReviewed
  return (
    <div className={loading ? classes.loadingRoot : classes.root} onFocus={()=>setShowGuidelines(true)}>
      <RecaptchaWarning currentUser={currentUser}>
        <div className={padding ? classes.form : null}>
        {commentWillBeHidden && <div className={classes.modNote}><em>
          A moderator will need to review your account before your comments will show up.
        </em></div>}

        <WrappedSmartForm
          collection={Comments}
          mutationFragment={getFragment(fragment)}
          successCallback={wrappedSuccessCallback}
          cancelCallback={wrappedCancelCallback}
          submitCallback={(data) => { 
            setLoading(true);
            return data
          }}
          errorCallback={() => setLoading(false)}
          prefilledProps={prefilledProps}
          layout="elementOnly"
          formComponents={{
            FormSubmit: SubmitComponent,
            FormGroupLayout: Components.DefaultStyleFormGroup
          }}
          alignmentForumPost={post?.af}
          addFields={currentUser?[]:["contents"]}
          removeFields={removeFields}
          formProps={formProps}
        />
        </div>
        {post && enableGuidelines && showGuidelines && <div className={classes.moderationGuidelinesWrapper}>
          <ModerationGuidelinesBox post={post} />
        </div>}
      </RecaptchaWarning>
    </div>
  );
};

const CommentsNewFormComponent = registerComponent('CommentsNewForm', CommentsNewForm, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    CommentsNewForm: typeof CommentsNewFormComponent,
  }
}

