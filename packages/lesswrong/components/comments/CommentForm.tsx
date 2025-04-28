import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { Components } from "@/lib/vulcan-lib/components";
import { isFriendlyUI } from "@/themes/forumTheme";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { getUpdatedFieldValues } from "../tanstack-form-components/helpers";
import { TanStackCheckbox } from "../tanstack-form-components/TanStackCheckbox";
import { useEditorFormCallbacks, TanStackEditor } from "../tanstack-form-components/TanStackEditor";
import { TanStackMuiTextField } from "../tanstack-form-components/TanStackMuiTextField";
import { cancelButtonStyles, submitButtonStyles } from "../tanstack-form-components/TanStackSubmit";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { TanStackDatePicker } from "../form-components/FormComponentDateTime";
import { LegacyFormGroupLayout } from "../tanstack-form-components/LegacyFormGroupLayout";
import { TanStackEditCommentTitle } from "../tanstack-form-components/TanStackEditCommentTitle";
import { TanStackQuickTakesTags } from "../tanstack-form-components/TanStackQuickTakesTags";
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
import { useFormErrors } from "../tanstack-form-components/BaseAppForm";

const formStyles = defineStyles('CommentForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
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
  const { Loading } = Components;
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
        className={classNames(formButtonClass, classes.submitButton)}
        onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              name: "LoginPopup",
              contents: ({onClose}) => <Components.LoginPopup onClose={onClose}/>,
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
  const { Error404, FormGroupNoStyling, FormGroupQuickTakes } = Components;
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();

  const formType = initialData ? 'edit' : 'new';

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
          const { data } = await create({ data: formApi.state.values });
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
      } catch (error) {
        onError?.();
        setCaughtError(error);
      }
    },
  });

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  const showAfCheckbox = !isAF && alignmentForumPost && (userIsMemberOf(currentUser, 'alignmentForum') || userIsAdmin(currentUser));

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
    <form className={classNames("vulcan-form", formClassName)} onSubmit={(e) => {
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
        {initialData && commentAllowTitle(initialData) && <div className={classes.fieldWrapper}>
          <form.Field name="title">
            {(field) => (
              <TanStackEditCommentTitle
                field={field}
                placeholder="Title (optional)"
              />
            )}
          </form.Field>
        </div>}

        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="contents">
            {(field) => (
              <TanStackEditor
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
              <TanStackCheckbox
                field={field}
                label="Pinned"
              />
            )}
          </form.Field>
        </div>}

        {quickTakesTagsEnabledSetting.get() && form.state.values.shortform && <div className={classes.fieldWrapper}>
          <form.Field name="relevantTagIds">
            {(field) => (
              <TanStackQuickTakesTags
                field={field}
              />
            )}
          </form.Field>
        </div>}

        {showAfCheckbox && <div className={classes.fieldWrapper}>
          <form.Field name="af">
            {(field) => (
              <TanStackCheckbox
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
              <TanStackDatePicker
                field={field}
                label="Replies blocked until"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="hideAuthor">
            {(field) => (
              <TanStackCheckbox
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
              <TanStackMuiTextField
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
