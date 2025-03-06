import React, { useCallback, useState } from "react";
import { getDraftMessageHtml } from "../../lib/collections/messages/helpers";
import { useSingle } from "../../lib/crud/withSingle";
import { TemplateQueryStrings } from "./NewConversationButton";
import classNames from "classnames";
import { FormDisplayMode } from "../comments/CommentsNewForm";
import {isFriendlyUI} from '../../themes/forumTheme'
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";
import { Loading } from "@/components/vulcan-core/Loading";
import ForumIcon from "@/components/common/ForumIcon";
import Error404 from "@/components/common/Error404";
import { Button } from "@/components/mui-replacement";

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
});

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
  const [loading, setLoading] = useState(false);

  const skip = !templateQueries?.templateId;
  const isMinimalist = formStyle === "minimalist"
  const extraFormProps = isMinimalist ? {commentMinimalistStyle: true, editorHintText: "Type a new message..."} : {}

  const { document: template, loading: loadingTemplate } = useSingle({
    documentId: templateQueries?.templateId,
    collectionName: "ModerationTemplates",
    fragmentName: "ModerationTemplateFragment",
    skip,
  });

  const SubmitComponent = useCallback(
    ({ submitLabel = "Submit" }) => {
      const formButtonClass = isMinimalist ? classes.formButtonMinimalist : classes.formButton;

      return (
        <div className={classNames("form-submit", { [classes.submitMinimalist]: isMinimalist })}>
          <Button
            type="submit"
            id="new-message-submit"
            className={classNames("primary-form-submit-button", formButtonClass)}
          >
            {loading ? <Loading /> : isMinimalist ? <ForumIcon icon="ArrowRightOutline" /> : submitLabel}
          </Button>
        </div>
      );
    },
    [
      ForumIcon,
      Loading,
      classes.formButton,
      classes.formButtonMinimalist,
      classes.submitMinimalist,
      isMinimalist,
      loading,
    ]
  );

  // For some reason loading returns true even if we're skipping the query?
  if (!skip && loadingTemplate) return <Loading />;
  if (templateQueries?.templateId && !template) return <Error404 />;

  const templateHtml =
    template?.contents?.html &&
    getDraftMessageHtml({ html: template.contents.html, displayName: templateQueries?.displayName });

  return (
    <div className={isMinimalist ? classes.rootMinimalist : classes.root}>
      <WrappedSmartForm
        collectionName="Messages"
        submitLabel={submitLabel}
        successCallback={() => {
          setLoading(false);
          return successEvent();
        }}
        submitCallback={(data: unknown) => {
          setLoading(true);
          return data;
        }}
        prefilledProps={{
          conversationId,
          contents: {
            originalContents: {
              type: "ckEditorMarkup",
              data: templateHtml,
            },
          },
        }}
        mutationFragment={getFragment("messageListFragment")}
        errorCallback={(message: any) => {
          setLoading(false);
          //eslint-disable-next-line no-console
          console.error("Failed to send", message);
        }}
        formComponents={{
          FormSubmit: SubmitComponent,
        }}
        formProps={{
          ...extraFormProps,
        }}
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

export default MessagesNewFormComponent;
