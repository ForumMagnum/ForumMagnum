import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
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
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { LegacyFormGroupLayout } from "@/components/tanstack-form-components/LegacyFormGroupLayout";
import { EditCommentTitle } from "@/components/editor/EditCommentTitle";
import { FormComponentQuickTakesTags } from "@/components/form-components/FormComponentQuickTakesTags";
import { commentAllowTitle } from "@/lib/collections/comments/helpers";
import { userIsAdmin, userIsAdminOrMod, userIsMemberOf } from "@/lib/vulcan-users/permissions";
import { quickTakesTagsEnabledSetting } from "@/lib/publicSettings";
import { isAF, isLWorAF } from "@/lib/instanceSettings";
import type { TagCommentType } from "@/lib/collections/comments/types";
import type { ReviewYear } from "@/lib/reviewUtils";
import { useCurrentUser } from "../common/withUser";
import ArrowForward from "@/lib/vendor/@material-ui/icons/src/ArrowForward";
import { useDialog } from "../common/withDialog";
import { COMMENTS_NEW_FORM_PADDING } from "@/lib/collections/comments/constants";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { useFormSubmitOnCmdEnter } from "../hooks/useFormSubmitOnCmdEnter";
import LoginPopup from "../users/LoginPopup";
import Loading from "../vulcan-core/Loading";
import Error404 from "../common/Error404";
import FormGroupNoStyling from "../form-components/FormGroupNoStyling";
import FormGroupQuickTakes from "../form-components/FormGroupQuickTakes";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { hasDraftComments } from '@/lib/betas';

const formStyles = defineStyles('CommentForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
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
}));

const customSubmitButtonStyles = defineStyles('CommentSubmit', (theme: ThemeType) => ({
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
  submitSegmented: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
}), { stylePriority: 1 });

interface CommentSubmitProps {
  isMinimalist: boolean;
  formDisabledDueToRateLimit: boolean;
  isQuickTake: boolean;
  type: string;
  loading: boolean;
  quickTakesSubmitButtonAtBottom?: boolean;
}

interface InnerButtonProps {
  variant?: 'contained',
  color?: 'primary',
  disabled?: boolean
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
}: CommentSubmitProps & {
  submitLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  cancelCallback?: () => (void | Promise<void>);
}) => {
  const classes = useStyles(customSubmitButtonStyles);
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();

  const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton;
  // by default, the EA Forum uses MUI contained buttons here
  const cancelBtnProps: InnerButtonProps = isFriendlyUI && !isMinimalist ? { variant: "contained" } : {};
  const submitBtnProps: InnerButtonProps = isFriendlyUI && !isMinimalist ? { variant: "contained", color: "primary" } : {};
  if (formDisabledDueToRateLimit || loading) {
    submitBtnProps.disabled = true;
  }

  return (
    <div
      className={classNames(classes.submit, {
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
        className={classNames(formButtonClass, classes.submitButton, {
          [classes.submitSegmented]: hasDraftComments,
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
        {loading ? <Loading /> : isMinimalist ? <ArrowForward /> : submitLabel}
      </Button>
    </div>
  );
}

export const CommentForm = ({
  initialData,
  prefilledProps,
  alignmentForumPost,
  quickTakesFormGroup,
  formClassName,
  editorHintText,
  commentMinimalistStyle,
  maxHeight,
  submitLabel,
  cancelLabel,
  commentSubmitProps,
  onSubmit,
  onSuccess,
  onCancel,
  onError,
}: {
  initialData?: UpdateCommentDataInput & { _id: string; tagCommentType: TagCommentType };
  prefilledProps?: {
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
  quickTakesFormGroup?: boolean;
  formClassName?: string;
  editorHintText?: string;
  commentMinimalistStyle?: boolean;
  maxHeight?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  commentSubmitProps?: CommentSubmitProps;
  onSubmit?: () => void;
  onSuccess: (doc: CommentsList) => void;
  onCancel: () => void;
  onError?: () => void;
}) => {
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();

  const formType = initialData ? 'edit' : 'new';

  const showAfCheckbox = !isAF && alignmentForumPost && (userIsMemberOf(currentUser, 'alignmentForum') || userIsAdmin(currentUser));

  const DefaultFormGroupLayout = quickTakesFormGroup
    ? FormGroupQuickTakes
    : FormGroupNoStyling;

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<CommentsList>();

  const { create } = useCreate({
    collectionName: 'Comments',
    fragmentName: 'CommentsList',
  });

  const { mutate } = useUpdate({
    collectionName: 'Comments',
    fragmentName: 'CommentsList',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' ? prefilledProps : {}),
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();
      onSubmit?.();

      try {
        let result: CommentsList;

        if (formType === 'new') {
          const { af, ...rest } = formApi.state.values;
          const submitData = (showAfCheckbox || isAF) ? { ...rest, af } : rest;

          const { data } = await create({ data: submitData });
          result = data?.createComment.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateComment.data;
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

  const handleSubmit = useCallback(() => form.handleSubmit(), [form]);
  const formRef = useFormSubmitOnCmdEnter(handleSubmit);

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  const showAlignmentOptionsGroup = isLWorAF && formType === 'edit' && (userIsMemberOf(currentUser, 'alignmentForumAdmins') || userIsAdmin(currentUser));

  const submitElement = formType === 'new' && commentSubmitProps
    ? <CommentSubmit
        {...commentSubmitProps}
        submitLabel={submitLabel}
        cancelLabel={cancelLabel}
        cancelCallback={onCancel}
      />
    : <div className="form-submit">
        <Button
          className={classNames("form-cancel", classes.cancelButton)}
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
        >
          {cancelLabel ?? 'Cancel'}
        </Button>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={classNames("primary-form-submit-button", classes.submitButton)}
            >
              {submitLabel ?? 'Submit'}
            </Button>
          )}
        </form.Subscribe>
      </div>;

  return (
    <form className={classNames("vulcan-form", formClassName)} ref={formRef} onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
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
                hintText={isFriendlyUI ? "Write a new comment..." : defaultEditorPlaceholder}
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
