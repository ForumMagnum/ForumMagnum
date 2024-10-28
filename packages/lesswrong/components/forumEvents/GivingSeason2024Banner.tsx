import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

const GivingSeason2024Banner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      Custom component
    </div>
  );
}

const GivingSeason2024BannerComponent = registerComponent(
  "GivingSeason2024Banner",
  GivingSeason2024Banner,
  {styles},
);

declare global {
  interface ComponentTypes {
    GivingSeason2024Banner: typeof GivingSeason2024BannerComponent
  }
}
