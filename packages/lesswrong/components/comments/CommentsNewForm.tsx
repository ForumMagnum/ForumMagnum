import React, {ComponentProps, useState, useEffect, useRef, useCallback} from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import { useDialog } from '../common/withDialog';
import { useSingle } from '../../lib/crud/withSingle';
import { hideUnreviewedAuthorCommentsSettings } from '../../lib/publicSettings';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { requireNewUserGuidelinesAck, userIsAllowedToComment } from '../../lib/collections/users/helpers';
import { useMessages } from '../common/withMessages';
import { useUpdate } from "../../lib/crud/withUpdate";
import { afNonMemberDisplayInitialPopup, afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import ArrowForward from '@material-ui/icons/ArrowForward';
import { TagCommentType } from '../../lib/collections/comments/types';
import { commentDefaultToAlignment } from '../../lib/collections/comments/helpers';
import { isInFuture } from '../../lib/utils/timeUtil';
import moment from 'moment';
import { isLWorAF } from '../../lib/instanceSettings';
import { useTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from '../../themes/forumTheme';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

export type FormDisplayMode = "default" | "minimalist"

export const COMMENTS_NEW_FORM_PADDING = isFriendlyUI ? 12 : 10;

const styles = (theme: ThemeType) => ({
  root: isFriendlyUI ? {
    '& .form-component-EditorFormComponent': {
      marginTop: 0
    }
  } : {},
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
  rootQuickTakes: {
    "& .form-component-EditorFormComponent": {
      background: theme.palette.grey[100],
      padding: COMMENTS_NEW_FORM_PADDING,
      borderTopLeftRadius: theme.borderRadius.quickTakesEntry,
      borderTopRightRadius: theme.borderRadius.quickTakesEntry,
    },
  },
  quickTakesSubmitButtonAtBottom: isFriendlyUI
    ? {
      "& .form-component-EditorFormComponent": {
        background: "transparent",
        borderRadius: theme.borderRadius.quickTakesEntry,
      },
      "& .form-input": {
        padding: "0 20px",
      },
    }
    : {},
  loadingRoot: {
    opacity: 0.5
  },
  form: {
    padding: COMMENTS_NEW_FORM_PADDING,
  },
  formMinimalist: {
    padding: '12px 10px 8px 10px',
  },
  quickTakesForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  rateLimitNote: {
    paddingTop: '4px',
    color: theme.palette.text.dim2,
  },
  modNote: {
    paddingTop: '4px',
    color: theme.palette.text.dim2,
  },
  submit: {
    textAlign: 'right',
  },
  submitQuickTakes: {
    background: theme.palette.grey[100],
    padding: COMMENTS_NEW_FORM_PADDING,
    borderBottomLeftRadius: theme.borderRadius.quickTakesEntry,
    borderBottomRightRadius: theme.borderRadius.quickTakesEntry,
  },
  submitQuickTakesButtonAtBottom: isFriendlyUI
    ? {
      marginTop: 20,
      padding: 20,
      borderTop: `1px solid ${theme.palette.grey[300]}`,
    }
    : {},
  formButton: isFriendlyUI ? {
    fontSize: 14,
    textTransform: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    boxShadow: 'none',
    marginLeft: 8,
  } : {
    fontSize: "16px",
    color: theme.palette.lwTertiary.main,
    marginLeft: "5px",
    "&:hover": {
      opacity: .5,
      backgroundColor: "none",
    },
  },
  cancelButton: {
    color: isFriendlyUI ? undefined : theme.palette.grey[400],
  },
  submitButton: isFriendlyUI ? {
    backgroundColor: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    '&:disabled': {
      backgroundColor: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite,
      opacity: .5,
    }
  } : {},
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

export type BtnProps = {
  variant?: 'contained',
  color?: 'primary',
  disabled?: boolean
}

export type CommentSuccessCallback = (
  comment: CommentsList,
  otherArgs: {form: AnyBecauseTodo},
) => void | Promise<void>;

export type CommentCancelCallback = (...args: unknown[]) => void | Promise<void>;

const shouldOpenNewUserGuidelinesDialog = (
  maybeProps: { user: UsersCurrent | null, post?: PostsMinimumInfo }
): maybeProps is Omit<ComponentProps<ComponentTypes['NewUserGuidelinesDialog']>, "onClose" | "classes"> => {
  const { user, post } = maybeProps;
  return !!user && requireNewUserGuidelinesAck(user) && !!post;
};

const getSubmitLabel = (isQuickTake: boolean, isAnswer?: boolean) => {
  if (isAnswer) {
    return isFriendlyUI ? 'Add answer' : 'Submit';
  }
  if (!isFriendlyUI) return 'Submit'
  return isQuickTake ? 'Publish' : 'Comment'
}

const CommentSubmit = ({
  isMinimalist,
  formDisabledDueToRateLimit,
  isQuickTake,
  quickTakesSubmitButtonAtBottom,
  type,
  cancelCallback,
  loading,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  className,
  classes,
}: {
  isMinimalist: boolean;
  formDisabledDueToRateLimit: boolean;
  isQuickTake: boolean;
  quickTakesSubmitButtonAtBottom?: boolean;
  type: string;
  cancelCallback?: CommentCancelCallback;
  loading: boolean;
  submitLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  className?: string,
  classes: ClassesType<typeof styles>;
}) => {
  const { Loading } = Components;

  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();

  const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton;
  // by default, the EA Forum uses MUI contained buttons here
  const cancelBtnProps: BtnProps = isFriendlyUI && !isMinimalist ? { variant: "contained" } : {};
  const submitBtnProps: BtnProps = isFriendlyUI && !isMinimalist ? { variant: "contained", color: "primary" } : {};
  if (formDisabledDueToRateLimit) {
    submitBtnProps.disabled = true;
  }

  return (
    <div
      className={classNames(classes.submit, className, {
        [classes.submitMinimalist]: isMinimalist,
        [classes.submitQuickTakes]: isQuickTake && !(quickTakesSubmitButtonAtBottom && isFriendlyUI),
        [classes.submitQuickTakesButtonAtBottom]: isQuickTake && quickTakesSubmitButtonAtBottom,
      })}
    >
      {type === "reply" && !isMinimalist && (
        <Button
          onClick={cancelCallback}
          className={classNames(formButtonClass, classes.cancelButton)}
          {...cancelBtnProps}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        id="new-comment-submit"
        className={classNames(formButtonClass, classes.submitButton)}
        onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {},
            });
            ev.preventDefault();
          }
        }}
        {...submitBtnProps}
      >
        {loading ? <Loading /> : isMinimalist ? <ArrowForward /> : submitLabel}
      </Button>
    </div>
  );
}

export type CommentsNewFormProps = {
  prefilledProps?: any,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  tagCommentType?: TagCommentType,
  parentComment?: CommentsList,
  successCallback?: CommentSuccessCallback,
  cancelCallback?: CommentCancelCallback,
  type: string,
  removeFields?: any,
  fragment?: FragmentName,
  formProps?: any,
  enableGuidelines?: boolean,
  padding?: boolean,
  formStyle?: FormDisplayMode,
  overrideHintText?: string,
  quickTakesSubmitButtonAtBottom?: boolean,
  isAnswer?: boolean,
  cancelLabel?: string,
  className?: string,
  classes: ClassesType<typeof styles>,
}

const CommentsNewForm = ({
  prefilledProps={},
  post,
  tag,
  tagCommentType="DISCUSSION",
  parentComment,
  successCallback,
  type,
  cancelCallback,
  removeFields,
  fragment="CommentsList",
  formProps,
  enableGuidelines=true,
  padding=true,
  formStyle="default",
  overrideHintText,
  quickTakesSubmitButtonAtBottom,
  isAnswer,
  cancelLabel,
  className,
  classes,
}: CommentsNewFormProps) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking({eventProps: { postId: post?._id, tagId: tag?._id, tagCommentType}});
  const commentSubmitStartTimeRef = useRef(Date.now());
  
  const userWithRateLimit = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersCurrentCommentRateLimit",
    extraVariables: { postId: 'String' },
    extraVariablesValues: { postId: post?._id },
    fetchPolicy: "cache-and-network",
    skip: !currentUser,
    ssr: false
  });
  const userNextAbleToComment = userWithRateLimit?.document?.rateLimitNextAbleToComment;
  const lastRateLimitExpiry: Date|null = (userNextAbleToComment && new Date(userNextAbleToComment.nextEligible)) ?? null;
  const rateLimitMessage = userNextAbleToComment ? userNextAbleToComment.rateLimitMessage : null
  
  // Disable the form if there's a rate limit and it's more than 1 minute until it
  // expires. (If the user is rate limited but it will expire sooner than that,
  // don't disable the form; it'll probably expire before they finish typing their
  // comment anyways, and this avoids an awkward interaction with the 15-second
  // rate limit that's only supposed to be there to prevent accidental double posts.
  // TODO
  const formDisabledDueToRateLimit = !!lastRateLimitExpiry && isInFuture(moment(lastRateLimitExpiry).subtract(1,'minutes').toDate());

  const {flash} = useMessages();
  prefilledProps = {
    ...prefilledProps,
    af: commentDefaultToAlignment(currentUser, post, parentComment),
  };
  
  const isQuickTake = !!prefilledProps.shortform
  const isMinimalist = formStyle === "minimalist"
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [loading, setLoading] = useState(false)
  const [_,setForceRefreshState] = useState(0);

  const { openDialog } = useDialog();
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
  })
  
  // On focus (this bubbles out from the text editor), show moderation guidelines.
  // Defer this through a setTimeout, because otherwise clicking the Cancel button
  // doesn't work (the focus event fires before the click event, the state change
  // causes DOM nodes to get replaced, and replacing the DOM nodes prevents the
  // rest of the click event handlers from firing.)
  const onFocusCommentForm: React.FocusEventHandler = () => {
    setTimeout(() => {
      // TODO: user field for showing new user guidelines
      // TODO: decide if post should be required?  We might not have a post param in the case of shortform, not sure where else
      const dialogProps = { user: currentUser, post };
      if (shouldOpenNewUserGuidelinesDialog(dialogProps)) {
        openDialog({
          componentName: 'NewUserGuidelinesDialog',
          componentProps: dialogProps,
        });
      }
      if (isLWorAF) {
        setShowGuidelines(true);
      }
    }, 0);
  };

  const wrappedSuccessCallback = (comment: CommentsList, { form }: {form: any}) => {
    afNonMemberSuccessHandling({currentUser, document: comment, openDialog, updateDocument: updateComment })
    if (comment.deleted) {
      flash(comment.deletedReason);
    }
    if (successCallback) {
      void successCallback(comment, {form});
    }
    setLoading(false)
    const timeElapsed = Date.now() - commentSubmitStartTimeRef.current;
    captureEvent("wrappedSuccessCallbackFinished", {timeElapsed, commentId: comment._id})
    userWithRateLimit.refetch();
  };

  const wrappedCancelCallback = (...args: unknown[]) => {
    if (cancelCallback) {
      void cancelCallback(...args);
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

  prefilledProps = {
    ...prefilledProps,
    answer: !!isAnswer,
  };

  const SubmitComponent = useCallback(
    (formSubmitProps: ComponentProps<ComponentTypes['FormSubmit']>) => (
      <CommentSubmit
        {...{
          isMinimalist,
          classes,
          formDisabledDueToRateLimit,
          isQuickTake,
          quickTakesSubmitButtonAtBottom,
          type,
          loading,
          ...formSubmitProps,
          // We want to pass in this cancel callback, rather than whatever gets passed in to FormSubmit
          cancelCallback,
        }}
      />
    ),
    [cancelCallback, classes, formDisabledDueToRateLimit, isMinimalist, isQuickTake, loading, quickTakesSubmitButtonAtBottom, type]
  );

  const hideDate = hideUnreviewedAuthorCommentsSettings.get()
  const commentWillBeHidden = hideDate && new Date(hideDate) < new Date() &&
    currentUser && !currentUser.isReviewed 
  const extraFormProps = {
    ...(isMinimalist ? {commentMinimalistStyle: true, editorHintText: "Reply..."} : {}),
    ...(overrideHintText ? {editorHintText: overrideHintText} : {})
  }
  const answerFormProps = isAnswer
    ? {editorHintText: isFriendlyUI && isAnswer ? 'Write a new answer...' : undefined}
    : {};
  const parentDocumentId = post?._id || tag?._id

  useEffect(() => {
    // If disabled due to rate limit, set a timer to reenable the comment form when the rate limit expires
    if (formDisabledDueToRateLimit && userNextAbleToComment) {
      const timeLeftOnUserRateLimitMS = new Date(userNextAbleToComment).getTime() - new Date().getTime()
      const timer = setTimeout(() => {
        setForceRefreshState((n) => (n+1));
      }, timeLeftOnUserRateLimitMS);
      
      return () => clearTimeout(timer);
    }
  }, [userNextAbleToComment, formDisabledDueToRateLimit]);
  
  // @ts-ignore FIXME: Not enforcing that the post-author fragment has enough fields for userIsAllowedToComment
  if (currentUser && !userCanDo(currentUser, `posts.moderate.all`) && !userIsAllowedToComment(currentUser, prefilledProps, post?.user, !!parentComment)
  ) {
    return <span>Sorry, you do not have permission to comment at this time.</span>
  }

  const {
    ModerationGuidelinesBox, WrappedSmartForm, RecaptchaWarning,
    NewCommentModerationWarning, RateLimitWarning, FormGroupQuickTakes,
    FormGroupNoStyling,
  } = Components;
  return (
    <div className={classNames(
      className,
      isMinimalist ? classes.rootMinimalist : classes.root,
      {
        [classes.loadingRoot]: loading,
        [classes.rootQuickTakes]: isQuickTake,
        [classes.quickTakesSubmitButtonAtBottom]: isQuickTake && quickTakesSubmitButtonAtBottom,
      }
    )} onFocus={onFocusCommentForm}>
      <RecaptchaWarning currentUser={currentUser}>
        <div className={padding
          ? classNames({
            [classes.form]: !isMinimalist && !(isQuickTake && quickTakesSubmitButtonAtBottom),
            [classes.formMinimalist]: isMinimalist,
          })
          : undefined
        }>
          {formDisabledDueToRateLimit && <RateLimitWarning
            contentType="comment"
            lastRateLimitExpiry={lastRateLimitExpiry}
            rateLimitMessage={rateLimitMessage}
          />}
          <div onFocus={(ev) => {
            afNonMemberDisplayInitialPopup(currentUser, openDialog)
            ev.preventDefault()
          }}>
            <WrappedSmartForm
              id="new-comment-form"
              collectionName="Comments"
              mutationFragmentName={fragment}
              successCallback={wrappedSuccessCallback}
              cancelCallback={wrappedCancelCallback}
              submitCallback={(data: unknown) => {
                setLoading(true);
                commentSubmitStartTimeRef.current = Date.now()
                captureEvent("wrappedSubmitCallbackStarted")
                return data
              }}
              errorCallback={() => setLoading(false)}
              prefilledProps={prefilledProps}
              layout="elementOnly"
              formComponents={{
                FormSubmit: SubmitComponent,
                FormGroupLayout: isQuickTake && !(quickTakesSubmitButtonAtBottom && isFriendlyUI)
                  ? FormGroupQuickTakes
                  : FormGroupNoStyling,
              }}
              alignmentForumPost={post?.af}
              addFields={currentUser ? [] : ["title", "contents"]}
              removeFields={removeFields}
              formProps={{
                formClassName: isQuickTake ? classes.quickTakesForm : '',
                ...extraFormProps,
                ...formProps,
                ...answerFormProps,
              }}
              cancelLabel={cancelLabel}
              submitLabel={getSubmitLabel(isQuickTake, isAnswer)}
            />
          </div>
        </div>
        {parentDocumentId && enableGuidelines && showGuidelines && <div className={classes.moderationGuidelinesWrapper}>
          {commentWillBeHidden && <div className={classes.modNote}>
            <NewCommentModerationWarning />
          </div>}
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

