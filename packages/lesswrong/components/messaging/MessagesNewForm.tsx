import React, { useCallback, useState } from "react";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { getDraftMessageHtml } from "../../lib/collections/messages/helpers";
import { useSingle } from "../../lib/crud/withSingle";
import { TemplateQueryStrings } from "./NewConversationButton";
import classNames from "classnames";
import { FormDisplayMode } from "../comments/CommentsNewForm";
import {isFriendlyUI} from '../../themes/forumTheme'
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCreate } from "@/lib/crud/withCreate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { useForm } from "@tanstack/react-form";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { TanStackCheckbox } from "../tanstack-form-components/TanStackCheckbox";
import { useEditorFormCallbacks, TanStackEditor } from "../tanstack-form-components/TanStackEditor";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
  },
  rootMinimalist: {
    ...theme.typography.commentStyle,
    padding: 10,
    border: theme.palette.border.extraFaint,
    borderRadius: theme.borderRadius.default,
    backgroundColor: theme.palette.grey[100],
    width: "100%",
    '& .form-section-default': {
      width: "100%"
    },
    '& .form-input': {
      width: "100%",
      margin: '2.5px 0 0 0'
    },
    '& form': {
      display: "flex",
      flexDirection: "row",
    }
  },
});

const formStyles = defineStyles('MessagesForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitMinimalist: {
    height: 'fit-content',
    marginTop: "auto",
  },
  formButton: {
    fontFamily: theme.typography.fontFamily,
    marginLeft: "5px",
    ...(isFriendlyUI
      ? {
          fontSize: 14,
          fontWeight: 500,
          textTransform: "none",
          background: theme.palette.primary.main,
          color: theme.palette.text.alwaysWhite, // Dark mode independent
          "&:hover": {
            background: theme.palette.primary.light,
          },
        }
      : {
          paddingBottom: 2,
          fontSize: 16,
          color: theme.palette.secondary.main,
          "&:hover": {
            background: theme.palette.panelBackground.darken05,
          },
        }),
  },
  formButtonMinimalist: {
    padding: "8px",
    margin: "-6px -6px -6px 0",
    fontSize: "16px",
    minWidth: 28,
    minHeight: 28,
    marginLeft: "5px",
    backgroundColor: "transparent",
    color: theme.palette.primary.main,
    overflowX: "hidden",  // to stop loading dots from wrapping around
    background: "transparent",
    fontWeight: 500,
    '&:hover': {
      backgroundColor: theme.palette.background.primaryDim,
    }
  },
}));

interface MessagesNewFormProps {
  isMinimalist: boolean;
  submitLabel?: React.ReactNode;
  prefilledProps: {
    conversationId: string;
    contents: {
      originalContents: {
        type: string;
        data: string;
      };
    };
  };
  onSuccess: (doc: messageListFragment) => void;
}

const InnerMessagesNewForm = ({
  isMinimalist,
  submitLabel = "Submit",
  prefilledProps,
  onSuccess,
}: MessagesNewFormProps) => {
  const { Loading, ForumIcon } = Components;

  const classes = useStyles(formStyles);
  const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton;
  const hintText = isMinimalist ? "Type a new message..." : defaultEditorPlaceholder;
  const commentMinimalistStyle = isMinimalist ? true : false;

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<typeof form.state.values, messageListFragment>();

  const { create } = useCreate({
    collectionName: 'Messages',
    fragmentName: 'messageListFragment',
  });

  const form = useForm({
    defaultValues: {
      ...prefilledProps,
      noEmail: false,
    },
    onSubmit: async ({ value }) => {
      if (onSubmitCallback.current) {
        value = await onSubmitCallback.current(value);
      }

      let result: messageListFragment;

      const { data } = await create({ data: value });
      result = data?.createMessage.data;

      if (onSuccessCallback.current) {
        result = onSuccessCallback.current(result, {});
      }

      onSuccess(result);
    },
  });

  return (
    <form className="vulcan-form" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
        <form.Field name="contents">
          {(field) => (
            <TanStackEditor
              field={field}
              name="contents"
              formType='new'
              document={form.state.values}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
              hintText={hintText}
              commentMinimalistStyle={commentMinimalistStyle}
              fieldName="contents"
              collectionName="Messages"
              commentEditor={true}
              commentStyles={true}
              hideControls={false}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="noEmail">
          {(field) => (
            <TanStackCheckbox
              field={field}
              label="No email"
            />
          )}
        </form.Field>
      </div>

      <div className="form-submit">
        <form.Subscribe selector={(s) => [s.isSubmitting]}>
          {([isSubmitting]) => (
            <div className={classNames("form-submit", { [classes.submitMinimalist]: isMinimalist })}>
              <Button
                type="submit"
                id="new-message-submit"
                className={classNames("primary-form-submit-button", formButtonClass)}
              >
                {isSubmitting ? <Loading /> : isMinimalist ? <ForumIcon icon="ArrowRightOutline" /> : submitLabel}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};

export const MessagesNewForm = ({
  conversationId,
  templateQueries,
  successEvent,
  submitLabel,
  formStyle="default",
  classes,
}: {
  conversationId: string;
  templateQueries?: TemplateQueryStrings;
  successEvent: () => void;
  submitLabel?: string,
  formStyle?: FormDisplayMode;
  classes: ClassesType<typeof styles>;
}) => {
  const { Loading, Error404 } = Components;

  const skip = !templateQueries?.templateId;
  const isMinimalist = formStyle === "minimalist"

  const { document: template, loading: loadingTemplate } = useSingle({
    documentId: templateQueries?.templateId,
    collectionName: "ModerationTemplates",
    fragmentName: "ModerationTemplateFragment",
    skip,
  });

  // For some reason loading returns true even if we're skipping the query?
  if (!skip && loadingTemplate) return <Loading />;
  if (templateQueries?.templateId && !template) return <Error404 />;

  const templateHtml =
    template?.contents?.html &&
    getDraftMessageHtml({ html: template.contents.html, displayName: templateQueries?.displayName });

  return (
    <div className={isMinimalist ? classes.rootMinimalist : classes.root}>
      <InnerMessagesNewForm
        isMinimalist={isMinimalist}
        submitLabel={submitLabel}
        prefilledProps={{
          conversationId,
          contents: {
            originalContents: {
              type: "ckEditorMarkup",
              data: templateHtml ?? '',
            },
          },
        }}
        onSuccess={() => successEvent()}
      />
    </div>
  );
};

const MessagesNewFormComponent = registerComponent("MessagesNewForm", MessagesNewForm, { styles });

declare global {
  interface ComponentTypes {
    MessagesNewForm: typeof MessagesNewFormComponent;
  }
}
