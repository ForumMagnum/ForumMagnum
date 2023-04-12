import React, { ComponentProps, useState, useContext } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { Comments } from '../../lib/collections/comments/collection';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import { useDialog } from '../common/withDialog';
import { hideUnreviewedAuthorCommentsSettings } from '../../lib/publicSettings';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { requireNewUserGuidelinesAck, userIsAllowedToComment } from '../../lib/collections/users/helpers';
import { useMessages } from '../common/withMessages';
import { useUpdateComment } from '../hooks/useUpdateComment';
import { afNonMemberDisplayInitialPopup, afCommentNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import ArrowForward from '@material-ui/icons/ArrowForward';
import { TagCommentType } from '../../lib/collections/comments/types';
import { commentDefaultToAlignment } from '../../lib/collections/comments/helpers';
import { CommentPoolContext } from './CommentPool';
import { isLW } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';

export type CommentFormDisplayMode = "default" | "minimalist"

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  rootMinimalist: {
    '& .form-input': {
      width: "100%",
      margin: 0,
      marginTop: 4,
    },
    '& form': {
      display: "flex",
      flexDirection: "row",
    }
  },
  loadingRoot: {
    opacity: 0.5
  },
  form: {
    padding: 10,
  },
  formMinimalist: {
    padding: '12px 10px 8px 10px',
  },
  modNote: {
    paddingTop: '4px',
    color: theme.palette.text.dim2,
  },
  submit: {
    textAlign: 'right',
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      opacity: .5,
      backgroundColor: "none",
    },
    color: theme.palette.lwTertiary.main,
  },
  cancelButton: {
    color: theme.palette.grey[400],
  },
  submitMinimalist: {
    height: 'fit-content',
    marginTop: "auto",
    marginBottom: 4,
  },
  formButtonMinimalist: {
    padding: "2px",
    fontSize: "16px",
    minWidth: 28,
    minHeight: 28,
    marginLeft: "5px",
    "&:hover": {
      opacity: .8,
      backgroundColor: theme.palette.lwTertiary.main,
    },
    backgroundColor: theme.palette.lwTertiary.main,
    color: theme.palette.background.pageActiveAreaBackground,
    overflowX: "hidden",  // to stop loading dots from wrapping around
  },
  moderationGuidelinesWrapper: {
    backgroundColor: theme.palette.panelBackground.newCommentFormModerationGuidelines,
  }
});

const shouldOpenNewUserGuidelinesDialog = (
  maybeProps: { user: UsersCurrent | null, post?: PostsMinimumInfo }
): maybeProps is Omit<ComponentProps<ComponentTypes['NewUserGuidelinesDialog']>, "onClose" | "classes"> => {
  const { user, post } = maybeProps;
  return !!user && requireNewUserGuidelinesAck(user) && !!post;
};

export type CommentsNewFormProps = {
  prefilledProps?: any,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  tagCommentType?: TagCommentType,
  parentComment?: any,
  successCallback?: (comment: CommentsList, otherArgs: any) => void,
  type: string,
  cancelCallback?: any,
  classes: ClassesType,
  removeFields?: any,
  fragment?: FragmentName,
  formProps?: any,
  enableGuidelines?: boolean,
  padding?: boolean
  replyFormStyle?: CommentFormDisplayMode
}

const CommentsNewForm = ({prefilledProps = {}, post, tag, tagCommentType = "DISCUSSION", parentComment, successCallback, type, cancelCallback, classes, removeFields, fragment = "CommentsList", formProps, enableGuidelines=true, padding=true, replyFormStyle = "default"}: CommentsNewFormProps) => {
  const currentUser = useCurrentUser();
  const {flash} = useMessages();
  const commentPoolContext = useContext(CommentPoolContext);
  prefilledProps = {
    ...prefilledProps,
    af: commentDefaultToAlignment(currentUser, post, parentComment),
  };
  
  const isMinimalist = replyFormStyle === "minimalist"
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [loading, setLoading] = useState(false)
  const { ModerationGuidelinesBox, WrappedSmartForm, RecaptchaWarning, Loading, ContentStyles } = Components
  
  const { openDialog } = useDialog();
  const updateComment = useUpdateComment('SuggestAlignmentComment')
  
  // On focus (this bubbles out from the text editor), show moderation guidelines.
  // Defer this through a setTimeout, because otherwise clicking the Cancel button
  // doesn't work (the focus event fires before the click event, the state change
  // causes DOM nodes to get replaced, and replacing the DOM nodes prevents the
  // rest of the click event handlers from firing.)
  const onFocusCommentForm = () => setTimeout(() => {
    // TODO: user field for showing new user guidelines
    // TODO: decide if post should be required?  We might not have a post param in the case of shortform, not sure where else
    const dialogProps = { user: currentUser, post };
    if (shouldOpenNewUserGuidelinesDialog(dialogProps)) {
      openDialog({
        componentName: 'NewUserGuidelinesDialog',
        componentProps: dialogProps,
        noClickawayCancel: true
      });
    }
    setShowGuidelines(true);
  }, 0);

  const wrappedSuccessCallback = (comment: CommentsList, { form }: {form: any}) => {
    afCommentNonMemberSuccessHandling({currentUser, comment, openDialog, updateComment })
    if (comment.deleted) {
      flash(comment.deletedReason);
    }
    if (successCallback) {
      successCallback(comment, { form })
    }
    setLoading(false)
    
    if (commentPoolContext) {
      void commentPoolContext.addComment(comment);
    }
  };

  const wrappedCancelCallback = (...args: unknown[]) => {
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
      tagId: tag._id,
      tagCommentType: tagCommentType,
    };
  }

  if (parentComment) {
    prefilledProps = {
      ...prefilledProps,
      parentCommentId: parentComment._id,
    };
  }

  const SubmitComponent = ({submitLabel = "Submit"}) => {
    const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton
    return <div className={classNames(classes.submit, {[classes.submitMinimalist]: isMinimalist})}>
      {(type === "reply" && !isMinimalist) && <Button
        onClick={cancelCallback}
        className={classNames(formButtonClass, classes.cancelButton)}
      >
        Cancel
      </Button>}
      <Button
        type="submit"
        id="new-comment-submit"
        className={formButtonClass}
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
        {loading ? <Loading /> : (isMinimalist ? <ArrowForward /> : submitLabel)}
      </Button>
    </div>
  };

  // @ts-ignore FIXME: Not enforcing that the post-author fragment has enough fields for userIsAllowedToComment
  if (currentUser && !userCanDo(currentUser, `posts.moderate.all`) && !userIsAllowedToComment(currentUser, prefilledProps, post?.user)) {
    return <span>Sorry, you do not have permission to comment at this time.</span>
  }

  const hideDate = hideUnreviewedAuthorCommentsSettings.get()
  const commentWillBeHidden = hideDate && new Date(hideDate) < new Date() &&
    currentUser && !currentUser.isReviewed
  const extraFormProps = isMinimalist ? {commentMinimalistStyle: true, editorHintText: "Reply..."} : {}
  const parentDocumentId = post?._id || tag?._id
  return (
    <div className={classNames(isMinimalist ? classes.rootMinimalist : classes.root, {[classes.loadingRoot]: loading})} onFocus={onFocusCommentForm}>
      <RecaptchaWarning currentUser={currentUser}>
        <div className={padding ? classNames({[classes.form]: !isMinimalist, [classes.formMinimalist]: isMinimalist}) : undefined}>
          {commentWillBeHidden && <div className={classes.modNote}>
            <ContentStyles contentType="comment">
              <em>
                {isLW ? <>
                  LessWrong is raising our moderation standards for new comments.<br/>
                  See <Link to="/posts/kyDsgQGHoLkXz6vKL/lw-team-is-adjusting-moderation-policy?commentId=CFS4ccYK3rwk6Z7Ac">this FAQ</Link> to ensure your comments are approved.
                </>
                : <>A moderator will need to review your account before your comments will show up.</>
                }          
              </em>
            </ContentStyles>
          </div>}
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
              submitCallback={(data: unknown) => { 
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
              addFields={currentUser ? [] : ["title", "contents"]}
              removeFields={removeFields}
              formProps={{
                ...extraFormProps,
                ...formProps,
              }}
            />
          </div>
        </div>
        {parentDocumentId && enableGuidelines && showGuidelines && <div className={classes.moderationGuidelinesWrapper}>
          <ModerationGuidelinesBox documentId={parentDocumentId} commentType={post?._id ? "post" : "subforum"} />
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
