import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { PeopleDirectoryProvider } from "./usePeopleDirectory";
import { Link } from "../../lib/reactRouterWrapper";
import PeopleDirectoryMainSearch from "./PeopleDirectoryMainSearch";
import PeopleDirectoryFilters from "./PeopleDirectoryFilters";
import PeopleDirectoryResults from "./PeopleDirectoryResults";

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
});

const PeopleDirectoryPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageContext="peopleDirectory">
      <div className={classes.root}>
        <h1 className={classes.pageTitle}>
          People directory
        </h1>
        <PeopleDirectoryProvider>
          <PeopleDirectoryMainSearch />
          <PeopleDirectoryFilters />
          <PeopleDirectoryResults />
        </PeopleDirectoryProvider>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent(
  "PeopleDirectoryPage",
  PeopleDirectoryPage,
  {styles},
);


