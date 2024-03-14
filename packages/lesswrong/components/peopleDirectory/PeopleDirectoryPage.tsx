import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { PeopleDirectoryProvider } from "./usePeopleDirectory";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: "20px 50px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 12,
  },
});

export const PeopleDirectoryPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {PeopleDirectoryInput, PeopleDirectoryResults} = Components;
  return (
    <AnalyticsContext pageContext="peopleDirectory">
      <PeopleDirectoryProvider>
        <div className={classes.root}>
          <h1 className={classes.pageTitle}>People directory</h1>
          <PeopleDirectoryInput />
          {/* TODO: Add filters here */}
          <PeopleDirectoryResults />
        </div>
      </PeopleDirectoryProvider>
    </AnalyticsContext>
  );
}

const PeopleDirectoryPageComponent = registerComponent(
  "PeopleDirectoryPage",
  PeopleDirectoryPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryPage: typeof PeopleDirectoryPageComponent
  }
}
