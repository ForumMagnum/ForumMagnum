import React from "react";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { currentWrappedYear } from "./hooks";
import { useCurrentUser } from "@/components/common/withUser";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { Link } from "@/lib/reactRouterWrapper";

const styles = defineStyles("WrappedAd", (theme: ThemeType) => ({
  root: {
    maxWidth: 260,
    display: "flex",
    flexDirection: "column",
    rowGap: "9px",
    fontSize: 13,
    fontWeight: 450,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 32,
  },
  container: {
    backgroundColor: theme.palette.wrapped.background,
    color: theme.palette.text.alwaysWhite,
    padding: "12px 24px",
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      opacity: 1,
      backgroundColor: theme.palette.wrapped.darkBackground,
    },
  },
  heading: {
    fontWeight: 600,
    fontSize: 16,
    lineHeight: "22px",
    margin: 0,
  },
  highlight: {
    color: theme.palette.wrapped.highlightText,
  },
}));

export const WrappedAd = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  if (!currentUser) {
    return null;
  }
  return (
    <AnalyticsContext pageSubSectionContext="wrappedAd">
      <div className={classes.root}>
        <Link to="/wrapped" className={classes.container}>
          <h2 className={classes.heading}>
            Your {currentWrappedYear()} EA Forum
            <div className={classes.highlight}>Wrapped</div>
          </h2>
        </Link>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent('WrappedAd', WrappedAd);
