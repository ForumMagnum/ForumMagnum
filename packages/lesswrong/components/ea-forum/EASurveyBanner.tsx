import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    position: "sticky",
    top: 0,
    zIndex: 100000,
    padding: 20,
    background: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 15,
    fontWeight: 450,
    textAlign: "center",
    color: theme.palette.text.alwaysWhite,
  },
});

const EASurveyBanner = ({classes}: {classes: ClassesType}) => {
  return (
    <div className={classes.root}>
      Help evaluate the forum by taking the 5 minute EA Forum survey
    </div>
  );
}

const EASurveyBannerComponent = registerComponent(
  "EASurveyBanner",
  EASurveyBanner,
  {styles},
);

declare global {
  interface ComponentTypes {
    EASurveyBanner: typeof EASurveyBannerComponent
  }
}
