import React, { useCallback, useState } from "react";
import moment from "moment";
import { AI_DISCLOSURE_COOKIE } from "@/lib/cookies/cookies";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { Link } from "@/lib/reactRouterWrapper";
import ForumIcon from "../common/ForumIcon";

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
    fontSize: "14px",
    fontWeight: 450,
    "& a": {
      fontWeight: 500,
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
      },
    },
  },
  dismiss: {
    width: 16,
    cursor: "pointer",
  },
});

export const NewPostAIPolicy = ({postId, classes}: {
  postId?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const [cookies, setCookie] = useCookiesWithConsent();
  const [isHidden, setIsHidden] = useState(cookies[AI_DISCLOSURE_COOKIE] === "true");

  const onDismiss = useCallback(() => {
    setIsHidden(true);
    setCookie(AI_DISCLOSURE_COOKIE, "true", {
      path: "/",
      expires: moment().add(10, "years").toDate(),
    });
    captureEvent("aiDisclosureDismissed", {postId});
  }, [setCookie, postId, captureEvent]);

  if (isHidden) {
    return null;
  }

  return (
    <AnalyticsContext pageElementContext="newPostAIPolicy">
      <section className={classes.root}>
        <ForumIcon icon="InfoCircle" className={classes.info} />
        <div className={classes.content}>
          Posts which contain AI writing will now be automatically labelled as
          &ldquo;partly&rdquo;, &ldquo;mostly&rdquo; or &ldquo;~entirely&rdquo;
          AI-written. You no longer need to disclose your own AI use.{" "}
          <Link to={POLICY_LINK} target="_blank">More details</Link>.
        </div>
        <ForumIcon icon="Close" onClick={onDismiss} className={classes.dismiss} />
      </section>
    </AnalyticsContext>
  );
}

export default registerComponent("NewPostAIPolicy", NewPostAIPolicy, {styles});
