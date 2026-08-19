import React, { useCallback, useEffect, useState } from "react";
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
import { getUserDefaultEditor } from "../editor/Editor";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { useFormSubmitOnCmdEnter } from "../hooks/useFormSubmitOnCmdEnter";
import Loading from "../vulcan-core/Loading";
import ForumIcon from "../common/ForumIcon";
import Error404 from "../common/Error404";
import ComposerSubmitButton from "../sunshineDashboard/supermod/ComposerSubmitButton";

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
    borderRadius: theme.borderRadius.small,
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
    marginTop: 16,
    marginBottom: 16,
  },
  submitMinimalist: {
    height: 'fit-content',
    marginTop: "auto",
    alignSelf: "end",
  },
  formButton: {
    fontFamily: theme.typography.fontFamily,
    marginLeft: "5px",
    paddingBottom: 2,
    fontSize: 16,
    color: theme.palette.secondary.main,
    "&:hover": {
      background: theme.palette.panelBackground.darken05,
    },
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
  messageInputForm: {
    '--lexical-comment-min-height': '1em',
  },
}));

const InnerMessagesNewForm = ({
  isMinimalist,
  submitLabel = "Submit",
  sendEmail = true,
  keystrokeSubmitButton = false,
  registerSubmit,
  prefilledProps,
  templateQueries,
  conversationId,
  optimisticEvent,
  failureEvent,
  onSuccess,
}: {
  isMinimalist: boolean;
  submitLabel?: React.ReactNode;
  sendEmail?: boolean;
  keystrokeSubmitButton?: boolean;
  registerSubmit?: (fn: () => void) => void;
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
  optimisticEvent?: () => void;
  failureEvent?: () => void;
  onSuccess: (doc: messageListFragment) => void;
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  
  const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton;
  const hintText = isMinimalist ? "Type a new message..." : getDefaultEditorPlaceholder();
  const commentMinimalistStyle = isMinimalist ? true : false;

  // Tracks emptiness for the keystroke submit button's disabled state; the
  // form field value only updates on a throttle, so it can't be used for this
  const [editorIsBlank, setEditorIsBlank] = useState(!prefilledProps.contents.originalContents.data.trim());

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
        optimisticEvent?.();
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
        failureEvent?.();
        setCaughtError(error);
      }
    },
  });


  const handleSubmit = useCallback(async () => {
    if (form.state.isSubmitting || (keystrokeSubmitButton && editorIsBlank)) return;
    await form.handleSubmit();
  }, [form, keystrokeSubmitButton, editorIsBlank]);
  const formRef = useFormSubmitOnCmdEnter(handleSubmit);

  // Lets the supermod sidebar submit the form from outside it (the collapsed
  // Send Message button and its Cmd+M shortcut)
  useEffect(() => {
    if (!registerSubmit) return;
    registerSubmit(() => void handleSubmit());
    return () => registerSubmit(() => {});
  }, [registerSubmit, handleSubmit]);

  return (
    <div>
      {displayedErrorComponent}
      <form className="vulcan-form" ref={formRef} onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}>
        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper, classes.messageInputForm)}>
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
                onBlankStateChange={keystrokeSubmitButton ? setEditorIsBlank : undefined}
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
              {keystrokeSubmitButton
                ? <ComposerSubmitButton
                    type="submit"
                    label={isSubmitting ? <Loading /> : submitLabel}
                    disabled={editorIsBlank || isSubmitting}
                  />
                : <Button
                    type="submit"
                    id="new-message-submit"
                    className={classNames("primary-form-submit-button", formButtonClass)}
                  >
                    {isSubmitting ? <Loading /> : isMinimalist ? <ForumIcon icon="ArrowRightOutline" /> : submitLabel}
                  </Button>}
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
  keystrokeSubmitButton,
  registerSubmit,
  optimisticEvent,
  failureEvent,
  formStyle="default",
}: {
  conversationId: string;
  templateQueries?: TemplateQueryStrings;
  successEvent: (newMessage: messageListFragment) => void;
  submitLabel?: string,
  sendEmail?: boolean;
  /** Supermod sidebar style: Ctrl+Enter badge on the submit button, disabled while empty */
  keystrokeSubmitButton?: boolean;
  /** Hands the form's submit function to the parent so it can be triggered from outside (e.g. the supermod sidebar's Cmd+M shortcut) */
  registerSubmit?: (fn: () => void) => void;
  /** Called immediately before the mutation so a parent can update optimistically. */
  optimisticEvent?: () => void;
  /** Called if the mutation fails so the parent can roll back its optimistic update. */
  failureEvent?: () => void;
  formStyle?: FormDisplayMode;
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const initialEditorType = getUserDefaultEditor(currentUser);
  const [formKey, setFormKey] = useState(0);
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
    <div className={isMinimalist ? classes.rootMinimalist : classes.root} key={formKey}>
      <InnerMessagesNewForm
        isMinimalist={isMinimalist}
        submitLabel={submitLabel}
        sendEmail={sendEmail}
        keystrokeSubmitButton={keystrokeSubmitButton}
        registerSubmit={registerSubmit}
        optimisticEvent={optimisticEvent}
        failureEvent={failureEvent}
        prefilledProps={{
          conversationId,
          contents: {
            originalContents: {
              type: initialEditorType,
              data: templateHtml ?? '',
            },
          },
        }}
        templateQueries={templateQueries}
        conversationId={conversationId}
        onSuccess={(newMessage) => {
          setFormKey(formKey => formKey + 1);
          successEvent(newMessage);
        }}
      />
    </div>
  );
};

export default MessagesNewForm;
