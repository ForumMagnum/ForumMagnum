import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { PeopleDirectoryProvider } from "./usePeopleDirectory";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: "20px 50px",
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
  const {PeopleDirectoryInput} = Components;
  return (
    <AnalyticsContext pageContext="peopleDirectory">
      <PeopleDirectoryProvider>
        <div className={classes.root}>
          <h1 className={classes.pageTitle}>People directory</h1>
          <PeopleDirectoryInput />
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
