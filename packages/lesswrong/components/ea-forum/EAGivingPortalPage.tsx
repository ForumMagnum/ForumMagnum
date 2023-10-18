import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

const EAGivingPortalPage = ({classes}: {classes: ClassesType}) => {
  const {HeadTags} = Components;
  return (
    <AnalyticsContext pageContext="eaGivingPortal">
      <div className={classes.root}>
        <HeadTags title="Giving portal" />
        Giving portal
      </div>
    </AnalyticsContext>
  );
}

const EAGivingPortalPageComponent = registerComponent(
  "EAGivingPortalPage",
  EAGivingPortalPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAGivingPortalPage: typeof EAGivingPortalPageComponent;
  }
}
