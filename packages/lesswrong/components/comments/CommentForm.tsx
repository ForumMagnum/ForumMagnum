import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { isFriendlyUI } from "@/themes/forumTheme";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React, { useCallback } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { cancelButtonStyles, submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import { getDefaultEditorPlaceholder } from '@/lib/editor/defaultEditorPlaceholder';
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { LegacyFormGroupLayout } from "@/components/tanstack-form-components/LegacyFormGroupLayout";
import { EditCommentTitle } from "@/components/editor/EditCommentTitle";
import { FormComponentQuickTakesTags } from "@/components/form-components/FormComponentQuickTakesTags";
import { commentAllowTitle } from "@/lib/collections/comments/helpers";
import { userIsAdmin, userIsAdminOrMod, userIsMemberOf } from "@/lib/vulcan-users/permissions";
import { quickTakesTagsEnabledSetting, isAF, isLWorAF } from "@/lib/instanceSettings";
import type { TagCommentType } from "@/lib/collections/comments/types";
import type { ReviewYear } from "@/lib/reviewUtils";
import { useCurrentUser } from "../common/withUser";
import ArrowForward from "@/lib/vendor/@material-ui/icons/src/ArrowForward";
import { useDialog } from "../common/withDialog";
import { getCommentsNewFormPadding } from "@/lib/collections/comments/constants";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { useFormSubmitOnCmdEnter } from "../hooks/useFormSubmitOnCmdEnter";
import LoginPopup from "../users/LoginPopup";
import Loading from "../vulcan-core/Loading";
import Error404 from "../common/Error404";
import FormGroupNoStyling from "../form-components/FormGroupNoStyling";
import FormGroupQuickTakes from "../form-components/FormGroupQuickTakes";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { withDateFields } from "@/lib/utils/dateUtils";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { hasDraftComments } from '@/lib/betas';
import CommentsSubmitDropdown from "./CommentsSubmitDropdown";
import { useTracking } from "@/lib/analyticsEvents";
import { CommentsList } from "@/lib/collections/comments/fragments";
import { isIfAnyoneBuildsItFrontPage } from '../seasonal/styles';

const CommentsListUpdateMutation = gql(`
  mutation updateCommentCommentForm($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const CommentsListMutation = gql(`
  mutation createCommentCommentForm($data: CreateCommentDataInput!) {
    createComment(data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const formStyles = defineStyles('CommentForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    ...isIfAnyoneBuildsItFrontPage( {
      background: theme.palette.editor.bannerAdBackground,
      color: theme.palette.text.bannerAdOverlay,
    }),
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
  submitSegmented: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
}));

const customSubmitButtonStyles = defineStyles('CommentSubmit', (theme: ThemeType) => ({
  submit: {
    display: 'flex',
    justifyContent: 'end',
  },
  submitQuickTakes: {
    background: theme.palette.grey[100],
    padding: getCommentsNewFormPadding(theme),
    borderBottomLeftRadius: theme.borderRadius.quickTakesEntry,
    borderBottomRightRadius: theme.borderRadius.quickTakesEntry,
  },
  submitQuickTakesButtonAtBottom: theme.isFriendlyUI
    ? {
      marginTop: 20,
      padding: 20,
      borderTop: `1px solid ${theme.palette.grey[300]}`,
    }
    : {},
  formButton: theme.isFriendlyUI ? {
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
    color: theme.isFriendlyUI ? undefined : theme.palette.grey[400],
  },
  submitButton: theme.isFriendlyUI ? {
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
  submitSegmented: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  submitWrapper: {
    display: "flex",
  },
}), { stylePriority: 1 });

export type CommentInteractionType = "comment" | "reply";

interface CommentSubmitProps {
  isMinimalist: boolean;
  formDisabledDueToRateLimit?: boolean;
  isQuickTake: boolean;
  showCancelButton: boolean;
  loading?: boolean;
  quickTakesSubmitButtonAtBottom?: boolean;

  disableSubmitDropdown?: boolean;
  submitLabel: React.ReactNode;
  handleSubmit: (meta: {draft: boolean}) => Promise<void>,
  cancelLabel?: React.ReactNode;
  cancelCallback?: () => (void | Promise<void>);

  formCanSubmit: boolean;
  formIsSubmitting: boolean;
}

type CommentFormPassthroughSubmitProps = Pick<CommentSubmitProps,
  'formDisabledDueToRateLimit' |
  'isQuickTake' |
  'quickTakesSubmitButtonAtBottom' |
  'loading'
>;

interface InnerButtonProps {
  variant?: 'contained',
  color?: 'primary',
  disabled?: boolean
}

const CommentSubmit = ({
  isMinimalist = false,
  formDisabledDueToRateLimit = false,
  isQuickTake = false,
  disableSubmitDropdown = false,
  showCancelButton = false,
  quickTakesSubmitButtonAtBottom,
  loading = false,
  submitLabel = "Submit",
  handleSubmit,
  cancelLabel = "Cancel",
  cancelCallback,
  formCanSubmit,
  formIsSubmitting,
}: CommentSubmitProps) => {
  const classes = useStyles(customSubmitButtonStyles);
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();

  const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton;
  const cancelBtnProps: InnerButtonProps = isFriendlyUI() && !isMinimalist ? { variant: "contained" } : {};
  const submitBtnProps: InnerButtonProps = isFriendlyUI() && !isMinimalist ? { variant: "contained", color: "primary" } : {};

  const actualSubmitDisabled = formDisabledDueToRateLimit || loading || !formCanSubmit || formIsSubmitting;
  if (actualSubmitDisabled) {
    submitBtnProps.disabled = true;
  }

  const showDropdownMenu = hasDraftComments() && !disableSubmitDropdown;

  return (
    <div
      className={classNames(classes.submit, {
        [classes.submitMinimalist]: isMinimalist,
        [classes.submitQuickTakes]: isQuickTake && !(quickTakesSubmitButtonAtBottom && isFriendlyUI()),
        [classes.submitQuickTakesButtonAtBottom]: isQuickTake && quickTakesSubmitButtonAtBottom,
      })}
    >
      {showCancelButton && !isMinimalist && (
        <Button
          onClick={cancelCallback}
          className={classNames(formButtonClass, classes.cancelButton)}
          {...cancelBtnProps}
        >
          {cancelLabel}
        </Button>
      )}
      <div className={classes.submitWrapper}>
        <Button
          type="submit"
          id="new-comment-submit"
          className={classNames(formButtonClass, classes.submitButton, {
            [classes.submitSegmented]: showDropdownMenu,
          })}
          onClick={(ev) => {
            if (!currentUser) {
              openDialog({
                name: "LoginPopup",
                contents: ({onClose}) => <LoginPopup onClose={onClose}/>,
              });
              ev.preventDefault();
            }
          }}
          {...submitBtnProps}
        >
          {(formIsSubmitting || loading) ? <Loading /> : isMinimalist ? <ArrowForward /> : submitLabel}
        </Button>
        {showDropdownMenu && <CommentsSubmitDropdown handleSubmit={handleSubmit} />}
      </div>
    </div>
  );
}

export const CommentForm = ({
  initialData,
  prefilledProps,
  alignmentForumPost,
  hideAlignmentForumCheckbox,
  quickTakesFormGroup,
  formClassName,
  editorHintText,
  commentMinimalistStyle,
  maxHeight,
  submitLabel,
  cancelLabel,
  commentSubmitProps,
  interactionType,
  disableSubmitDropdown,
  onSubmit,
  onSuccess,
  onCancel,
  onError,
}: {
  initialData?: CommentEdit;
  prefilledProps?: {
    postId?: string;
    parentAnswerId?: string;
    debateResponse?: boolean;
    forumEventId?: string;
    contents?: CreateRevisionDataInput;
    shortform?: boolean;
    shortformFrontpage?: boolean;
    relevantTagIds?: string[];
    nominatedForReview?: `${ReviewYear}`;
    reviewingForReview?: `${ReviewYear}`;
    forumEventMetadata?: DbComment['forumEventMetadata'];
  }
  alignmentForumPost?: boolean;
  hideAlignmentForumCheckbox?: boolean;
  quickTakesFormGroup?: boolean;
  formClassName?: string;
  editorHintText?: string;
  commentMinimalistStyle?: boolean;
  maxHeight?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  commentSubmitProps?: CommentFormPassthroughSubmitProps;
  interactionType?: CommentInteractionType;
  disableSubmitDropdown?: boolean;
  onSubmit?: () => void;
  onSuccess: (doc: CommentsList) => void;
  onCancel: () => void;
  onError?: () => void;
}) => {
  const { captureEvent } = useTracking();
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();

  const formType = initialData ? 'edit' : 'new';

  const showAfCheckbox = !hideAlignmentForumCheckbox && !isAF() && alignmentForumPost && (userIsMemberOf(currentUser, 'alignmentForum') || userIsAdmin(currentUser));

  const DefaultFormGroupLayout = quickTakesFormGroup
    ? FormGroupQuickTakes
    : FormGroupNoStyling;

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<CommentsList>();

  const [create] = useMutation(CommentsListMutation, {
    update: (cache, { data }) => {
      cache.modify({
        fields: {
          // This is a terrible hack where we check the name of the query in the apollo cache (which includes the inlined variable values passed into that instance of the query)
          // to determine whether to add the new comment to the results of _that_ query (rather than to all `comments` queries in the cache).
          // We also have to check things like the `drafts` argument; in some sense this is an incomplete replication of the old mingo functionality that we tossed out.
          comments(existingComments, { storeFieldName }) {
            const newComment = data?.createComment?.data;
            if (!newComment) {
              return existingComments;
            } else if (newComment.draft && !storeFieldName.includes('"drafts"')) {
              return existingComments;
            } else if (!newComment.postId && !newComment.tagId) {
              return existingComments;
            } else if (newComment.postId && !storeFieldName.includes(newComment.postId)) {
              return existingComments;
            } else if (newComment.tagId && !storeFieldName.includes(newComment.tagId)) {
              return existingComments;
            }

            const newCommentRef = cache.writeFragment({
              fragment: CommentsList,
              data: data?.createComment?.data,
              fragmentName: "CommentsList",
            });

            if (!existingComments || !existingComments.results) {
              return [newCommentRef];
            }

            const newResults = [...existingComments.results, newCommentRef];

            return {
              ...existingComments,
              results: newResults,
            };
          }
        }
      });
    }
  });

  const [mutate] = useMutation(CommentsListUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...withDateFields(initialData, ['repliesBlockedUntil', 'afDate', 'postedAt', 'lastEditedAt', 'lastSubthreadActivity']),
      ...(formType === 'new' ? prefilledProps : {}),
    },
    onSubmitMeta: {
      draft: false,
    },
    onSubmit: async ({ formApi, meta }) => {
      await onSubmitCallback.current?.();
      onSubmit?.();

      const { draft } = meta;

      try {
        let result: CommentsList;

        if (formType === 'new') {
          const { af, ...rest } = formApi.state.values;
          const submitData = (showAfCheckbox || isAF()) ? { ...rest, af } : rest;

          const { data } = await create({ variables: { data: { ...submitData, draft } } });
          if (!data?.createComment?.data) {
            throw new Error('Failed to create comment');
          }
          result = data.createComment.data;

        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData?._id },
              data: { ...updatedFields, draft }
            }
          });
          if (!data?.updateComment?.data) {
            throw new Error('Failed to update comment');
          }
          result = data.updateComment.data;
        }

        onSuccessCallback.current?.(result);

        onSuccess(result);
        setCaughtError(undefined);

        formApi.reset();
      } catch (error) {
        onError?.();
        setCaughtError(error);
      }
    },
  });

  const formRef = useFormSubmitOnCmdEnter(() => form.handleSubmit());

  const onFocusChanged = useCallback((focus: boolean) => {
      captureEvent("commentFormFocusChanged", {
        focus,
        formType,
        editingCommentId: form.state.values?._id,
        editingCommentPostId: form.state.values?.postId,
        draft: form.state.values?.draft,
      });
    },
    [captureEvent, formType, form.state.values?._id, form.state.values?.postId, form.state.values?.draft]
  );

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  const showAlignmentOptionsGroup = isLWorAF() && formType === 'edit' && (userIsMemberOf(currentUser, 'alignmentForumAdmins') || userIsAdmin(currentUser));

  const submitElement = (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => {
        const isReplyOrEdit = (formType === 'new' && interactionType === 'reply') || formType === 'edit';

        const showCancelButton = isReplyOrEdit && !commentMinimalistStyle;

        return (
          <CommentSubmit
            {...commentSubmitProps}
            isMinimalist={commentMinimalistStyle ?? false}
            isQuickTake={commentSubmitProps?.isQuickTake ?? form.state.values.shortform ?? false}
            disableSubmitDropdown={disableSubmitDropdown}
            showCancelButton={showCancelButton}
            submitLabel={submitLabel}
            handleSubmit={form.handleSubmit}
            cancelLabel={cancelLabel}
            cancelCallback={onCancel}
            formCanSubmit={canSubmit}
            formIsSubmitting={isSubmitting}
          />
        );
      }}
    </form.Subscribe>
  );

  return (
    <form
      className={classNames("vulcan-form", formClassName)}
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit({ draft: false });
      }}
      onFocus={() => onFocusChanged(true)}
      onBlur={() => onFocusChanged(false)}
    >
      {displayedErrorComponent}
      <DefaultFormGroupLayout
        footer={<></>}
        heading={<></>}
        collapsed={false}
        hasErrors={false}
      >
        {commentAllowTitle(form.state.values) && <div className={classes.fieldWrapper}>
          <form.Field name="title">
            {(field) => (
              <EditCommentTitle
                field={field}
                placeholder="Title (optional)"
              />
            )}
          </form.Field>
        </div>}

        <div className={classNames("form-input", "form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="contents">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="contents"
                formType={formType}
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitCallback}
                addOnSuccessCallback={addOnSuccessCallback}
                getLocalStorageId={(comment) => {
                  if (comment._id) {
                    return {
                      id: comment._id,
                      verify: true,
                    };
                  }
                  if (comment.parentCommentId) {
                    return {
                      id: "parent:" + comment.parentCommentId,
                      verify: false,
                    };
                  }
                  return {
                    id: "post:" + comment.postId,
                    verify: false,
                  };
                }}
                hintText={isFriendlyUI() ? "Write a new comment..." : getDefaultEditorPlaceholder()}
                fieldName="contents"
                collectionName="Comments"
                commentEditor={true}
                commentStyles={true}
                hideControls={false}
                editorHintText={editorHintText}
                commentMinimalistStyle={commentMinimalistStyle}
                maxHeight={maxHeight}
              />
            )}
          </form.Field>
        </div>

        {formType === 'edit' && userIsAdminOrMod(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="promoted">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Pinned"
              />
            )}
          </form.Field>
        </div>}

        {quickTakesTagsEnabledSetting.get() && form.state.values.shortform && <div className={classNames("form-input", "input-relevantTagIds", classes.fieldWrapper)}>
          <form.Field name="relevantTagIds">
            {(field) => (
              <FormComponentQuickTakesTags
                field={field}
              />
            )}
          </form.Field>
        </div>}

        {showAfCheckbox && <div className={classes.fieldWrapper}>
          <form.Field name="af">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="AI Alignment Forum"
              />
            )}
          </form.Field>
        </div>}
      </DefaultFormGroupLayout>

      {userIsAdminOrMod(currentUser) && formType === 'edit' && <LegacyFormGroupLayout label="Moderator Options" startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          <form.Field name="repliesBlockedUntil">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Replies blocked until"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="hideAuthor">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide author"
              />
            )}
          </form.Field>
        </div>}
      </LegacyFormGroupLayout>}

      {showAlignmentOptionsGroup && <LegacyFormGroupLayout label="Alignment Options" startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          <form.Field name="reviewForAlignmentUserId">
            {(field) => (
              <MuiTextField
                field={field}
                label="AF Review UserId"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      {submitElement}
    </form>
  );
};
