import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import { getDraftMessageHtml } from "../../lib/collections/messages/helpers";
import { useSingle } from "../../lib/crud/withSingle";
import { Components, getFragment, registerComponent } from "../../lib/vulcan-lib";
import { TemplateQueryStrings } from "./NewConversationButton";
import { isEAForum } from "../../lib/instanceSettings";
import classNames from "classnames";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle,
  },
  formButton: {
    fontFamily: theme.typography.fontFamily,
    marginLeft: "5px",
    ...(isEAForum
      ? {
          fontSize: 14,
          fontWeight: 500,
          textTransform: "none",
        }
      : {
          paddingBottom: 2,
          fontSize: 16,
        }),

    "&:hover": {
      background: theme.palette.panelBackground.darken05,
    },
  },
  submitButton: isEAForum
    ? {
        background: theme.palette.primary.main,
        color: "#fff", // Dark mode independent
        "&:hover": {
          background: theme.palette.primary.light,
        },
      }
    : {
        color: theme.palette.secondary.main,
      },
});

export const NewMessageForm = ({
  classes,
  conversationId,
  templateQueries,
  successEvent,
}: {
  classes: ClassesType;
  conversationId: string;
  templateQueries?: TemplateQueryStrings;
  successEvent: () => void;
}) => {
  const { WrappedSmartForm, Loading, Error404 } = Components;
  const [loading, setLoading] = useState(false);

  const skip = !templateQueries?.templateId;

  const { document: template, loading: loadingTemplate } = useSingle({
    documentId: templateQueries?.templateId,
    collectionName: "ModerationTemplates",
    fragmentName: "ModerationTemplateFragment",
    skip,
  });

  const SubmitComponent = ({ submitLabel = "Submit" }) => {
    return (
      <div className="form-submit">
        <Button
          type="submit"
          id="new-message-submit"
          className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
          color="primary"
        >
          {loading ? <Loading /> : submitLabel}
        </Button>
      </div>
    );
  };

  // For some reason loading returns true even if we're skipping the query?
  if (!skip && loadingTemplate) return <Loading />;
  if (templateQueries?.templateId && !template) return <Error404 />;

  const templateHtml =
    template?.contents?.html &&
    getDraftMessageHtml({ html: template.contents.html, displayName: templateQueries?.displayName });

  return (
    <div className={classes.root}>
      <WrappedSmartForm
        collectionName="Messages"
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
      />
    </div>
  );
};

const NewMessageFormComponent = registerComponent("NewMessageForm", NewMessageForm, { styles });

declare global {
  interface ComponentTypes {
    NewMessageForm: typeof NewMessageFormComponent;
  }
}
