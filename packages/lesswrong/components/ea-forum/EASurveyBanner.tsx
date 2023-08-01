import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { TypeformPopupEmbed } from "../common/TypeformEmbeds";

const styles = (theme: ThemeType) => ({
  root: {
    position: "sticky",
    top: 0,
    zIndex: 10000, // The typeform popup has z-index 10001
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "25px",
    padding: 16,
    background: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 15,
    fontWeight: 450,
    color: theme.palette.text.alwaysWhite,
  },
  button: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    borderRadius: theme.borderRadius.default,
    fontSize: 15,
    fontWeight: 500,
    padding: "8px 12px",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.9,
    },
  },
});

const EASurveyBanner = ({classes}: {classes: ClassesType}) => {
  const onClose = useCallback(() => {
  }, []);

  return (
    <div className={classes.root}>
      Help evaluate the forum by taking the 5 minute EA Forum survey
      <TypeformPopupEmbed
        widgetId="Z1wH4v8v"
        title="EA Forum survey"
        label="Take the survey"
        onClose={onClose}
        className={classes.button}
      />
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
