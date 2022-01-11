import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { Comments } from '../../lib/collections/comments/collection';
import { commentDefaultToAlignment } from '../../lib/collections/comments/helpers';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import { useDialog } from '../common/withDialog';
import { hideUnreviewedAuthorCommentsSettings } from '../../lib/publicSettings';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import { useMessages } from '../common/withMessages';
import { useUpdate } from "../../lib/crud/withUpdate";
import { afNonMemberDisplayInitialPopup, afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";

const styles = (theme: ThemeType): JssStyles => ({
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
  fragment?: FragmentName,
  formProps?: any,
  enableGuidelines?: boolean,
  padding?: boolean
}) => {
  const currentUser = useCurrentUser();
  const {flash} = useMessages();
  prefilledProps = {
    ...prefilledProps,
    af: commentDefaultToAlignment(currentUser, post, parentComment),
  };
  
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [loading, setLoading] = useState(false)
  const { ModerationGuidelinesBox, WrappedSmartForm, RecaptchaWarning, Loading } = Components
  
  const { openDialog } = useDialog();
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
  })
  

  const wrappedSuccessCallback = (comment: CommentsList, { form }: {form: any}) => {
    afNonMemberSuccessHandling({currentUser, document: comment, openDialog, updateDocument: updateComment })
    if (comment.deleted) {
      flash(comment.deletedReason);
    }
    if (successCallback) {
      successCallback(comment, { form })
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
    return <div className={classes.submit}>
      {(type === "reply") && <Button
        onClick={cancelCallback}
        className={classNames(classes.formButton, classes.cancelButton)}
      >
        Cancel
      </Button>}
      <Button
        type="submit"
        id="new-comment-submit"
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

  // @ts-ignore FIXME: Not enforcing that the post-author fragment has enough fields for userIsAllowedToComment
  if (currentUser && !userCanDo(currentUser, `posts.moderate.all`) && !userIsAllowedToComment(currentUser, prefilledProps, post?.user)) {
    return <span>Sorry, you do not have permission to comment at this time.</span>
  }

  const commentWillBeHidden = hideUnreviewedAuthorCommentsSettings.get() && currentUser && !currentUser.isReviewed
  return (
    <div className={loading ? classes.loadingRoot : classes.root} onFocus={()=>{
      // On focus (this bubbles out from the text editor), show moderation guidelines.
      // Defer this through a setTimeout, because otherwise clicking the Cancel button
      // doesn't work (the focus event fires before the click event, the state change
      // causes DOM nodes to get replaced, and replacing the DOM nodes prevents the
      // rest of the click event handlers from firing.)
      setTimeout(() => setShowGuidelines(true), 0);
    }}>
      <RecaptchaWarning currentUser={currentUser}>
        <div className={padding ? classes.form : null}>
          {commentWillBeHidden && <div className={classes.modNote}><em>
            A moderator will need to review your account before your comments will show up.
          </em></div>}
          <div onFocus={(ev) => {
            afNonMemberDisplayInitialPopup(currentUser, openDialog)
            ev.preventDefault()
          }}>
            <WrappedSmartForm
              id="new-comment-form"
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
