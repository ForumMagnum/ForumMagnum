import React, { useCallback } from "react";
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
    width: 16,
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

export const NewPostAIPolicy = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const onAddDisclosure = useCallback(() => {
  }, []);

  const onDismiss = useCallback(() => {
  }, []);

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
