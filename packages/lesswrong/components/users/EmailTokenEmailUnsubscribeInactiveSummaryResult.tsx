import React from "react";
import { siteNameWithArticleSetting } from "@/lib/instanceSettings";
import { Link } from "@/lib/reactRouterWrapper";
import { Typography } from "../common/Typography";
import { registerComponent } from "@/lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    margin: "32px auto",
    maxWidth: 680,
    "& a": {
      color: theme.palette.primary.dark,
    },
  },
});

const EmailTokenEmailUnsubscribeInactiveSummaryResult = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <Typography variant="body2">
        You have been unsubscribed from inactive user summary emails on{" "}
        {siteNameWithArticleSetting.get()}.
      </Typography>
      <Typography variant="body2">
        You can reenable these emails by selecting{" "}
        <Link to="/account?highlightField=sendInactiveSummaryEmail">
          "Send me a summary when I’ve been inactive" in account settings
        </Link>.
      </Typography>
    </div>
  );
}

export default registerComponent(
  "EmailTokenEmailUnsubscribeInactiveSummaryResult",
  EmailTokenEmailUnsubscribeInactiveSummaryResult,
  {styles},
);
