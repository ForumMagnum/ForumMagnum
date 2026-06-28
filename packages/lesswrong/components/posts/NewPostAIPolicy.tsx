import React, { RefObject, useCallback, useState } from "react";
import { captureException } from "@sentry/core";
import { parseDocument } from "htmlparser2";
import serializeDom from "dom-serializer";
import moment from "moment";
import type { EditContentsRef } from "../editor/EditorFormComponent";
import type { EditorContents } from "../editor/Editor";
import { AI_DISCLOSURE_COOKIE_PREFIX } from "@/lib/cookies/cookies";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { Link } from "@/lib/reactRouterWrapper";
import ForumIcon from "../common/ForumIcon";
import EAButton from "../ea-forum/EAButton";

const POLICY_LINK = "/posts/bxA9fsY9Psgarcq6e/new-ea-forum-llm-use-policy";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.background.primaryTranslucent,
    color: theme.palette.text.primaryAlert,
    fontFamily: theme.palette.fonts.sansSerifStack,
    borderRadius: theme.borderRadius.default,
    margin: "0 16px 16px",
    padding: 16,
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
  buttonContainer: {
    display: "flex",
    alignItems: "center",
  },
  button: {
    whiteSpace: "nowrap",
    minWidth: 120,
  },
  dismiss: {
    width: 16,
    cursor: "pointer",
  },
});

const disclosureHtml = `
<p>The following are examples. Please <strong>edit the below</strong> so that your disclosure is accurate:</p>
<ul>
  <li>
    <em>This post is the raw output of an LLM.</em>
  </li>
  <li>
    <em>I used AI to assist in writing this post, and it’s likely that >30% is AI-generated text.</em>
  </li>
  <li>
    <em>I used an LLM to help draft this post and it likely contains >10% AI-generated text, but I’ve edited/rewritten it extensively
    and endorse it.</em>
  </li>
</ul>
`;

const disclosureMarkdown = `The following are examples. Please **edit the below** so that your disclosure is accurate:
 - *This post is the raw output of an LLM.*
 - *I used AI to assist in writing this post, and it’s likely that >30% is AI-generated text.*
 - *I used an LLM to help draft this post and it likely contains >10% AI-generated text, but I’ve edited/rewritten it extensively
    and endorse it.*

`;

export const NewPostAIPolicy = ({postId, editContentsRef, classes}: {
  postId?: string,
  editContentsRef: RefObject<EditContentsRef | null>,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const [cookies, setCookie] = useCookiesWithConsent();
  const cookieName = postId
    ?`${AI_DISCLOSURE_COOKIE_PREFIX}${postId}`
    : null;
  const [isHidden, setIsHidden] = useState(
    cookieName ? cookies[cookieName] === "true" : false,
  );

  const hide = useCallback(() => {
    setIsHidden(true);
    if (cookieName) {
      setCookie(cookieName, "true", {
        path: "/",
        expires: moment().add(10, "years").toDate(),
      });
    }
  }, [cookieName, setCookie]);

  const onDismiss = useCallback(() => {
    hide();
    captureEvent("aiDisclosureDismissed", {postId});
  }, [hide, postId, captureEvent]);

  const onAddDisclosure = useCallback(async () => {
    try {
      const editContents = editContentsRef.current?.editContents;
      if (!editContents) {
        // eslint-disable-next-line no-console
        console.warn("Edit contents ref is empty");
        return;
      }
      await editContents(({type, value}: EditorContents) => {
        switch (type) {
          case "markdown":
            return {type, value: disclosureMarkdown + value};
          case "html": // Fallthrough
          case "ckEditorMarkup": {
            const document = parseDocument(value);
            const nodesToPrepend = parseDocument(disclosureHtml).children;
            document.children = [...nodesToPrepend, ...document.children];
            for (const node of nodesToPrepend) {
              node.parent = document;
            }
            return {type, value: serializeDom(document)};
          }
          default:
            throw new Error("Invalid contents type");
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error inserting AI disclosure:", e);
      captureException(e);
      return;
    }
    hide();
    captureEvent("aiDisclosureInserted", {postId});
  }, [hide, editContentsRef, postId, captureEvent]);

  if (isHidden) {
    return null;
  }

  return (
    <AnalyticsContext pageElementContext="newPostAIPolicy">
      <section className={classes.root}>
        <ForumIcon icon="InfoCircle" className={classes.info} />
        <div className={classes.content}>
          <div>
            Likely that more than 10% of your post was drafted by an LLM? Our{" "}
            <Link to={POLICY_LINK}>AI usage policy</Link>{" "}
            requires disclosure at the top of your post.
          </div>
          <div className={classes.buttonContainer}>
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
