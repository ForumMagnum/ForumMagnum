import React, {ComponentProps, useState, useEffect, useRef, useMemo} from 'react';
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
import { TagCommentType } from '../../lib/collections/comments/types';
import { commentDefaultToAlignment } from '../../lib/collections/comments/helpers';
import { isInFuture } from '../../lib/utils/timeUtil';
import moment from 'moment';
import { isLWorAF } from '../../lib/instanceSettings';
import { useTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from '../../themes/forumTheme';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { COMMENTS_NEW_FORM_PADDING } from '@/lib/collections/comments/constants';
import { CommentForm, type CommentInteractionType } from './CommentForm';
import NewUserGuidelinesDialog from "./NewUserGuidelinesDialog";
import ModerationGuidelinesBox from "./ModerationGuidelines/ModerationGuidelinesBox";
import RecaptchaWarning from "../common/RecaptchaWarning";
import NewCommentModerationWarning from "../sunshineDashboard/NewCommentModerationWarning";
import RateLimitWarning from "../editor/RateLimitWarning";
import { useLocation } from '@/lib/routeUtil';

export type FormDisplayMode = "default" | "minimalist"


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
  moderationGuidelinesWrapper: {
    backgroundColor: theme.palette.panelBackground.newCommentFormModerationGuidelines,
  }
});

export type CommentSuccessCallback = (
  comment: CommentsList,
) => void | Promise<void>;

export type CommentCancelCallback = (...args: unknown[]) => void | Promise<void>;

const shouldOpenNewUserGuidelinesDialog = (
  maybeProps: { user: UsersCurrent | null, post?: PostsMinimumInfo }
): maybeProps is Omit<ComponentProps<typeof NewUserGuidelinesDialog>, "onClose" | "classes"> => {
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

export type CommentsNewFormProps = {
  prefilledProps?: any,
  post?: PostsMinimumInfo & { question?: boolean },
  tag?: TagBasicInfo,
  tagCommentType?: TagCommentType,
  parentComment?: CommentsList,
  successCallback?: CommentSuccessCallback,
  cancelCallback?: CommentCancelCallback,
  interactionType: CommentInteractionType,
  // RM: this no longer does anything; it's used in two places to remove the `af` field
  // but I don't think it really matters.
  removeFields?: any,
  formProps?: {
    post?: PostsDetails;
    maxHeight?: boolean;
    editorHintText?: string;
  },
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
  interactionType,
  cancelCallback,
  removeFields,
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
          name: 'NewUserGuidelinesDialog',
          contents: ({onClose}) => <NewUserGuidelinesDialog
            onClose={onClose}
            {...dialogProps}
          />
        });
      }
      if (isLWorAF) {
        setShowGuidelines(true);
      }
    }, 0);
  };

  const { pathname } = useLocation();
  const wrappedSuccessCallback = (comment: CommentsList) => {
    afNonMemberSuccessHandling({currentUser, document: comment, openDialog, updateDocument: updateComment })
    if (comment.deleted && comment.deletedReason) {
      flash(comment.deletedReason);
    }
    if (comment.draft && comment.shortform && pathname === '/') {
      flash("Quick take saved as draft, visit your profile to edit it.");
    }
    if (successCallback) {
      void successCallback(comment);
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

  const hideDate = hideUnreviewedAuthorCommentsSettings.get();
  const commentWillBeHidden = (
    hideDate
    && new Date(hideDate) < new Date()
    && currentUser
    && !currentUser.isReviewed
  );

  const extraFormProps = useMemo(() => ({
    ...(isMinimalist ? {commentMinimalistStyle: true, editorHintText: "Reply..."} : {}),
    ...(overrideHintText ? {editorHintText: overrideHintText} : {})
  }), [isMinimalist, overrideHintText]);

  const answerFormProps = useMemo(() => isAnswer
    ? {editorHintText: isFriendlyUI && isAnswer ? 'Write a new answer...' : undefined}
    : {}, [isAnswer]);

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

  const mergedFormProps = useMemo(() => ({
    formClassName: isQuickTake ? classes.quickTakesForm : '',
    ...extraFormProps,
    ...formProps,
    ...answerFormProps,
  }), [isQuickTake, classes.quickTakesForm, extraFormProps, formProps, answerFormProps]);

  const commentSubmitProps = useMemo(() => ({
    formDisabledDueToRateLimit,
    isQuickTake,
    quickTakesSubmitButtonAtBottom,
    loading,
  }), [formDisabledDueToRateLimit, isQuickTake, quickTakesSubmitButtonAtBottom, loading]);
  
  // @ts-ignore FIXME: Not enforcing that the post-author fragment has enough fields for userIsAllowedToComment
  if (currentUser && !userCanDo(currentUser, `posts.moderate.all`) && !userIsAllowedToComment(currentUser, prefilledProps, post?.user, !!parentComment)
  ) {
    return <span>Sorry, you do not have permission to comment at this time.</span>
  }
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
            <CommentForm
              prefilledProps={prefilledProps}
              commentSubmitProps={commentSubmitProps}
              // Note: This is overly restrictive at the moment to focus on the core use case first, many of these would work
              disableSubmitDropdown={isAnswer || post?.question || prefilledProps.tagId}
              interactionType={interactionType}
              alignmentForumPost={post?.af}
              quickTakesFormGroup={isQuickTake && !(quickTakesSubmitButtonAtBottom && isFriendlyUI)}
              formClassName={mergedFormProps.formClassName}
              editorHintText={mergedFormProps.editorHintText}
              commentMinimalistStyle={mergedFormProps.commentMinimalistStyle}
              maxHeight={mergedFormProps.maxHeight}
              submitLabel={getSubmitLabel(isQuickTake, isAnswer)}
              cancelLabel={cancelLabel}
              onSuccess={wrappedSuccessCallback}
              onCancel={wrappedCancelCallback}
              onSubmit={() => {
                setLoading(true);
                commentSubmitStartTimeRef.current = Date.now()
                captureEvent("wrappedSubmitCallbackStarted")
              }}
              onError={() => {
                setLoading(false)
              }}
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

export default registerComponent('CommentsNewForm', CommentsNewForm, {
  styles,
  hocs: [withErrorBoundary]
});



