import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { PeopleDirectoryProvider } from "./usePeopleDirectory";
import { Link } from "../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: "20px 40px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    [theme.breakpoints.down("sm")]: {
      padding: "20px 0",
    },
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 700,
    marginTop: 0,
  },
  feedback: {
    marginTop: -24,
    marginBottom: 8,
    color: theme.palette.grey[600],
    fontWeight: 500,
    fontStyle: "italic",
    fontSize: 14,
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
  },
});

const PeopleDirectoryPageInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    PeopleDirectoryMainSearch, PeopleDirectoryFilters, PeopleDirectoryResults,
  } = Components;
  return (
    <AnalyticsContext pageContext="peopleDirectory">
      <div className={classes.root}>
        <h1 className={classes.pageTitle}>
          People directory
        </h1>
        <div className={classes.feedback}>
          This is a new feature, help us out by{" "}
          <Link
            to="https://tally.so/r/meBLeJ"
            target="_blank"
            rel="noopener noreferrer"
          >
            sharing your thoughts
          </Link>
        </div>
        <PeopleDirectoryProvider>
          <PeopleDirectoryMainSearch />
          <PeopleDirectoryFilters />
          <PeopleDirectoryResults />
        </PeopleDirectoryProvider>
      </div>
    </AnalyticsContext>
  );
}

export const PeopleDirectoryPage = registerComponent(
  "PeopleDirectoryPage",
  PeopleDirectoryPageInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryPage: typeof PeopleDirectoryPage
  }
}
