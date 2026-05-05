import React, { RefObject, useCallback } from "react";
import { parseDocument } from "htmlparser2";
import serializeDom from "dom-serializer";
import type { EditContentsRef } from "../editor/EditorFormComponent";
import type { EditorContents } from "../editor/Editor";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { Link } from "@/lib/reactRouterWrapper";
import ForumIcon from "../common/ForumIcon";
import EAButton from "../ea-forum/EAButton";

const POLICY_LINK = "#";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.background.primaryTranslucent,
    color: theme.palette.text.primaryAlert,
    fontFamily: theme.palette.fonts.sansSerifStack,
    borderRadius: theme.borderRadius.default,
    padding: 20,
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  info: {
    width: 20,
  },
  content: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "row",
    gap: "16px",
    fontSize: "14px",
    fontWeight: 450,
    "& a": {
      fontWeight: 500,
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
      },
    },
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  button: {
    whiteSpace: "nowrap",
    minWidth: 120,
  },
  dismiss: {
    width: 20,
    cursor: "pointer",
  },
});

const disclosureHtml = `
<p>Please <strong>edit the below</strong> so that your disclosure is accurate:</p>
<ul>
  <li>
    This post is the raw output of an LLM.
  </li>
  <li>
    I wrote this post myself, then asked an LLM to copy-edit it before posting.
  </li>
  <li>
    I used an LLM to help draft this post, but I’ve edited/rewritten it extensively
    and endorse it.
  </li>
</ul>
`;

const disclosureMarkdown = `Please __edit the below__ so that your disclosure is accurate:
 - This post is the raw output of an LLM.
 - I wrote this post myself, then asked an LLM to copy-edit it before posting.
 - I used an LLM to help draft this post, but I’ve edited/rewritten it extensively
   and endorse it.

`;

const prependHtml = (documentHtml: string, htmlToPrepend: string): string => {
  const document = parseDocument(documentHtml);
  const nodesToPrepend = parseDocument(htmlToPrepend).children;
  document.children = [...nodesToPrepend, ...document.children];
  for (const node of nodesToPrepend) {
    node.parent = document;
  }
  return serializeDom(document);
}

export const NewPostAIPolicy = ({editContentsRef, classes}: {
  editContentsRef: RefObject<EditContentsRef | null>,
  classes: ClassesType<typeof styles>,
}) => {
  const onDismiss = useCallback(() => {
  }, []);

  const onAddDisclosure = useCallback(() => {
    const editContents = editContentsRef.current?.editContents;
    if (!editContents) {
      console.warn("Edit contents ref is empty");
      return;
    }
    editContents(({type, value}: EditorContents) => {
      switch (type) {
        case "markdown":
          return {type, value: disclosureMarkdown + value};
        case "html": // Fallthrough
        case "ckEditorMarkup":
          return {type, value: prependHtml(value, disclosureHtml)};
        default:
          throw new Error("Invalid contents type");
      }
    });
    onDismiss();
  }, [onDismiss, editContentsRef]);

  return (
    <AnalyticsContext pageElementContext="newPostAIPolicy">
      <section className={classes.root}>
        <ForumIcon icon="InfoCircle" className={classes.info} />
        <div className={classes.content}>
          <div>
            Drafted with an LLM? Our{" "}
            <Link to={POLICY_LINK}>AI usage policy</Link>{" "}
            requires disclosure at the top of your post.
          </div>
          <div>
            <EAButton onClick={onAddDisclosure} className={classes.button}>
              Add disclosure
            </EAButton>
          </div>
        </div>
        <ForumIcon icon="Close" onClick={onDismiss} className={classes.dismiss} />
      </section>
    </AnalyticsContext>
  );
}

export default registerComponent("NewPostAIPolicy", NewPostAIPolicy, {styles});
