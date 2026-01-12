import React, { useCallback } from "react";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { getDraftMessageHtml } from "../../lib/collections/messages/helpers";
import { TemplateQueryStrings } from "./NewConversationButton";
import classNames from "classnames";
import { FormDisplayMode } from "../comments/CommentsNewForm";
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { getDefaultEditorPlaceholder } from '@/lib/editor/defaultEditorPlaceholder';
import { useForm } from "@tanstack/react-form";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { useFormSubmitOnCmdEnter } from "../hooks/useFormSubmitOnCmdEnter";
import Loading from "../vulcan-core/Loading";
import ForumIcon from "../common/ForumIcon";
import Error404 from "../common/Error404";

const messageListFragmentMutation = gql(`
  mutation createMessageMessagesNewForm($data: CreateMessageDataInput!) {
    createMessage(data: $data) {
      data {
        ...messageListFragment
      }
    }
  }
`);

const ModerationTemplateFragmentQuery = gql(`
  query MessagesNewForm($documentId: String) {
    moderationTemplate(input: { selector: { documentId: $documentId } }) {
      result {
        ...ModerationTemplateFragment
      }
    }
  }
`);

const styles = defineStyles('MessagesNewForm', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
  },
  rootMinimalist: {
    ...theme.typography.commentStyle,
    padding: "0 2px 0 10px",
    border: theme.palette.border.extraFaint,
    borderRadius: theme.isFriendlyUI ? theme.borderRadius.default : theme.borderRadius.small,
    backgroundColor: theme.palette.grey[100],
    width: "100%",
    '& form': {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
    },
    '& form > div': {
      marginTop: '2.5px',
      marginBottom: '2.5px',
    },
    '& form > .form-component-EditorFormComponent': {
      flexGrow: 1,
    },
    "& button": {
      marginLeft: 2,
    },
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitMinimalist: {
    height: 'fit-content',
    marginTop: "auto",
    alignSelf: "end",
  },
  formButton: {
    fontFamily: theme.typography.fontFamily,
    marginLeft: "5px",
    ...(theme.isFriendlyUI
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
    },
  },
}));

const InnerMessagesNewForm = ({
  isMinimalist,
  submitLabel = "Submit",
  sendEmail = true,
  prefilledProps,
  templateQueries,
  conversationId,
  onSuccess,
}: {
  isMinimalist: boolean;
  submitLabel?: React.ReactNode;
  sendEmail?: boolean;
  prefilledProps: {
    conversationId: string;
    contents: {
      originalContents: {
        type: string;
        data: string;
      };
    };
  };
  templateQueries?: TemplateQueryStrings;
  conversationId: string;
  onSuccess: (doc: messageListFragment) => void;
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  
  const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton;
  const hintText = isMinimalist ? "Type a new message..." : getDefaultEditorPlaceholder();
  const commentMinimalistStyle = isMinimalist ? true : false;

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback,
  } = useEditorFormCallbacks<messageListFragment>();

  const [create] = useMutation(messageListFragmentMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...prefilledProps,
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: messageListFragment;

        const submitData = userIsAdmin(currentUser) 
          ? { ...formApi.state.values, noEmail: !sendEmail } 
          : formApi.state.values;

        const { data } = await create({ variables: { data: submitData } });
        if (!data?.createMessage?.data) {
          throw new Error('Failed to create message');
        }
        result = data.createMessage.data;

        onSuccessCallback.current?.(result);

        onSuccess(result);
        setCaughtError(undefined);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });


  const handleSubmit = useCallback(() => form.handleSubmit(), [form]);
  const formRef = useFormSubmitOnCmdEnter(handleSubmit);

  return (
    <div>
      {displayedErrorComponent}
      <form className="vulcan-form" ref={formRef} onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}>
        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="contents">
            {(field) => (
              <EditorFormComponent
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
                hideControls={true}
                getLocalStorageId={() => ({id: conversationId, verify: false})}
              />
            )}
          </form.Field>
        </div>

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
      </form>
    </div>
  );
};

export const MessagesNewForm = ({
  conversationId,
  templateQueries,
  successEvent,
  submitLabel,
  sendEmail = true,
  formStyle="default",
}: {
  conversationId: string;
  templateQueries?: TemplateQueryStrings;
  successEvent: (newMessage: messageListFragment) => void;
  submitLabel?: string,
  sendEmail?: boolean;
  formStyle?: FormDisplayMode;
}) => {
  const classes = useStyles(styles);
  
  const skip = !templateQueries?.templateId;
  const isMinimalist = formStyle === "minimalist"

  const { loading: loadingTemplate, data } = useQuery(ModerationTemplateFragmentQuery, {
    variables: { documentId: templateQueries?.templateId },
    skip,
  });
  const template = data?.moderationTemplate?.result;

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
        sendEmail={sendEmail}
        prefilledProps={{
          conversationId,
          contents: {
            originalContents: {
              type: "ckEditorMarkup",
              data: templateHtml ?? '',
            },
          },
        }}
        templateQueries={templateQueries}
        conversationId={conversationId}
        onSuccess={(newMessage) => successEvent(newMessage)}
      />
    </div>
  );
};

export default MessagesNewForm;
