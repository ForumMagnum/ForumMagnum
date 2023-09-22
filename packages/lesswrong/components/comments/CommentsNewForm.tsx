import React, { ComponentProps, useState, useEffect, useRef, useContext } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import { useDialog } from '../common/withDialog';
import { useSingle } from '../../lib/crud/withSingle';
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
import { isEAForum } from '../../lib/instanceSettings';
import { isInFuture } from '../../lib/utils/timeUtil';
import moment from 'moment';
import { useTracking } from "../../lib/analyticsEvents";

export type CommentFormDisplayMode = "default" | "minimalist"

const styles = (theme: ThemeType): JssStyles => ({
  root: isEAForum ? {
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
  loadingRoot: {
    opacity: 0.5
  },
  form: {
    padding: isEAForum ? 12 : 10,
  },
  formMinimalist: {
    padding: '12px 10px 8px 10px',
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
  formButton: isEAForum ? {
    fontSize: 14,
    textTransform: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    boxShadow: 'none',
    marginLeft: 8,
  } : {
    paddingBottom: "2px",
    fontSize: "16px",
    color: theme.palette.lwTertiary.main,
    marginLeft: "5px",
    "&:hover": {
      opacity: .5,
      backgroundColor: "none",
    },
  },
  cancelButton: {
    color: isEAForum ? undefined : theme.palette.grey[400],
  },
  submitButton: isEAForum ? {
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

const shouldOpenNewUserGuidelinesDialog = (
  maybeProps: { user: UsersCurrent | null, post?: PostsMinimumInfo }
): maybeProps is Omit<ComponentProps<ComponentTypes['NewUserGuidelinesDialog']>, "onClose" | "classes"> => {
  const { user, post } = maybeProps;
  return !!user && requireNewUserGuidelinesAck(user) && !!post;
};

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

export type CommentsNewFormProps = {
  prefilledProps?: any,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  tagCommentType?: TagCommentType,
  parentComment?: any,
  successCallback?: CommentSuccessCallback,
  cancelCallback?: CommentCancelCallback,
  type: string,
  removeFields?: any,
  fragment?: FragmentName,
  formProps?: any,
  disableGuidelines?: boolean,
  padding?: boolean
  replyFormStyle?: CommentFormDisplayMode
  classes: ClassesType
  className?: string
}

const CommentsNewForm = ({
  prefilledProps = {},
  post,
  tag,
  tagCommentType = "DISCUSSION",
  parentComment,
  successCallback,
  type,
  cancelCallback,
  removeFields,
  fragment = "CommentsList",
  formProps,
  disableGuidelines=false,
  padding=true,
  replyFormStyle = "default",
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
  const formDisabledDueToRateLimit = lastRateLimitExpiry && isInFuture(moment(lastRateLimitExpiry).subtract(1,'minutes').toDate());

  const {flash} = useMessages();
  const commentPoolContext = useContext(CommentPoolContext);
  prefilledProps = {
    ...prefilledProps,
    af: commentDefaultToAlignment(currentUser, post, parentComment),
  };
  
  const isMinimalist = replyFormStyle === "minimalist"
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [loading, setLoading] = useState(false)
  const [_,setForceRefreshState] = useState(0);
  const { ModerationGuidelinesBox, WrappedSmartForm, RecaptchaWarning, Loading, NewCommentModerationWarning, RateLimitWarning } = Components
  
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
    if (!isEAForum) {
      setShowGuidelines(true);
    }
  }, 0);

  const wrappedSuccessCallback = (comment: CommentsList, { form }: {form: any}) => {
    afCommentNonMemberSuccessHandling({currentUser, comment, openDialog, updateComment })
    if (comment.deleted) {
      flash(comment.deletedReason);
    }
    if (successCallback) {
      void successCallback(comment, {form});
    }
    setLoading(false)
    
    if (commentPoolContext) {
      void commentPoolContext.addComment(comment);
    }
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

  const SubmitComponent = ({submitLabel = "Submit"}) => {
    const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton
    // by default, the EA Forum uses MUI contained buttons here
    const cancelBtnProps: BtnProps = isEAForum && !isMinimalist ? {variant: 'contained'} : {}
    const submitBtnProps: BtnProps = isEAForum && !isMinimalist ? {variant: 'contained', color: 'primary'} : {}
    if (formDisabledDueToRateLimit) {
      submitBtnProps.disabled = true
    }
    
    return <div className={classNames(classes.submit, {[classes.submitMinimalist]: isMinimalist})}>
      {(type === "reply" && !isMinimalist) && <Button
        onClick={cancelCallback}
        className={classNames(formButtonClass, classes.cancelButton)}
        {...cancelBtnProps}
      >
        Cancel
      </Button>}
      <Button
        type="submit"
        id="new-comment-submit"
        className={classNames(formButtonClass, classes.submitButton)}
        onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {}
            });
            ev.preventDefault();
          }
        }}
        {...submitBtnProps}
      >
        {loading ? <Loading /> : (isMinimalist ? <ArrowForward /> : submitLabel)}
      </Button>
    </div>
  };

  const hideDate = hideUnreviewedAuthorCommentsSettings.get()
  const commentWillBeHidden = hideDate && new Date(hideDate) < new Date() &&
    currentUser && !currentUser.isReviewed 
  const extraFormProps = isMinimalist ? {commentMinimalistStyle: true, editorHintText: "Reply..."} : {}
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

  return (
    <div className={classNames(
      className,
      isMinimalist ? classes.rootMinimalist : classes.root,
      {[classes.loadingRoot]: loading}
    )} onFocus={onFocusCommentForm}>
      <RecaptchaWarning currentUser={currentUser}>
        <div className={padding ? classNames({[classes.form]: !isMinimalist, [classes.formMinimalist]: isMinimalist}) : undefined}>
          {formDisabledDueToRateLimit && <RateLimitWarning lastRateLimitExpiry={lastRateLimitExpiry} rateLimitMessage={rateLimitMessage} />}
          <div onFocus={(ev) => {
            afNonMemberDisplayInitialPopup(currentUser, openDialog)
            ev.preventDefault()
          }}>
            <WrappedSmartForm
              id="new-comment-form"
              collectionName="Comments"
              mutationFragment={getFragment(fragment)}
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
                FormGroupLayout: Components.DefaultStyleFormGroup
              }}
              alignmentForumPost={post?.af}
              addFields={currentUser ? [] : ["title", "contents"]}
              removeFields={removeFields}
              formProps={{
                ...extraFormProps,
                ...formProps,
              }}
              submitLabel={isEAForum && !prefilledProps.shortform ? 'Comment' : 'Submit'}
            />
          </div>
        </div>
        {parentDocumentId && !disableGuidelines && showGuidelines && <div className={classes.moderationGuidelinesWrapper}>
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
