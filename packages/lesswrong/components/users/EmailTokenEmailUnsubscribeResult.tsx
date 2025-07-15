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

const EmailTokenEmailUnsubscribeResult = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <Typography variant="body2">
        You have been unsubscribed from all emails on{" "}
        {siteNameWithArticleSetting.get()}.
      </Typography>
      <Typography variant="body2">
        You will no longer receive any email notifications. If you'd like to
        update your preferences for individual emails, we recommend that you{" "}
        <Link to="/account?highlightField=unsubscribeFromAll">
          uncheck "Do not send me any emails (unsubscribe from all)"
        </Link>{" "}
        and instead toggle the settings for individual emails and notifications.
      </Typography>
    </div>
  );
}

export default registerComponent(
  "EmailTokenEmailUnsubscribeResult",
  EmailTokenEmailUnsubscribeResult,
  {styles},
);
