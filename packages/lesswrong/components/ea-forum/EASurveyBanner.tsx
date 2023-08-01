import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { TypeformPopupEmbed } from "../common/TypeformEmbeds";

const styles = (theme: ThemeType) => ({
  root: {
    position: "sticky",
    top: 0,
    zIndex: 10000, // The typeform popup has z-index 10001
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "25px",
    padding: 16,
    background: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 15,
    fontWeight: 450,
    color: theme.palette.text.alwaysWhite,
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      paddingRight: 60,
    },
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
  close: {
    position: "absolute",
    right: 20,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.9,
    },
  },
});

const EASurveyBanner = ({classes}: {classes: ClassesType}) => {
  const onCloseSurvey = useCallback(() => {
  }, []);

  const onDismissBanner = useCallback(() => {
  }, []);

  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      Help evaluate the forum by taking the 5 minute EA Forum survey
      <TypeformPopupEmbed
        widgetId="Z1wH4v8v"
        title="EA Forum survey"
        label="Take the survey"
        onClose={onCloseSurvey}
        className={classes.button}
      />
      <ForumIcon
        icon="Close"
        onClick={onDismissBanner}
        className={classes.close}
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
