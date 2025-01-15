import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 20,
    width: "100%",
    fontFamily: theme.palette.fonts.serifStack,
    fontSize: 18,
    marginTop: 12,
    border: theme.palette.border.commentBorder,
    borderWidth: 2,
    borderRadius: theme.borderRadius.default,
    borderColor: theme.palette.primary.main,
    background: theme.palette.background.pageActiveAreaBackground,
    [theme.breakpoints.down("xs")]: {
      padding: 12,
      fontSize: 16,
    },
  },
});

const BotSiteBanner = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { SingleColumnSection } = Components;

  return (
    <SingleColumnSection className={classes.root}>
      <div>
        Welcome to the EA Forum bot site. If you are trying to access the Forum programmatically (either by scraping or
        via the api) please use this site rather than <a href="https://forum.effectivealtruism.org">forum.effectivealtruism.org</a>.
        <br />
        <br />
        This site has the same content as the main site, but is run in a separate environment to avoid bots overloading the main site
        and affecting performance for human users.
      </div>
    </SingleColumnSection>
  );
};

const BotSiteBannerComponent = registerComponent("BotSiteBanner", BotSiteBanner, { styles });

declare global {
  interface ComponentTypes {
    BotSiteBanner: typeof BotSiteBannerComponent;
  }
}
