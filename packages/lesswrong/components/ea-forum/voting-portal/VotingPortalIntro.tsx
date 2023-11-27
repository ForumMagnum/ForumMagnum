import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { HEADER_HEIGHT } from "../../common/Header";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    borderRadius: 12,
    background: theme.palette.givingPortal[200],
    padding: 40,
    width: 730,
    maxWidth: "100%",
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
      borderRadius: 0,
      alignSelf: "flex-start",
    },
  },
  title: {
    color: theme.palette.givingPortal[1000],
    fontSize: 48,
    fontWeight: 700,
  },
});

const VotingPortalIntro = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <div className={classes.title}>Vote in the Donation Election 2023</div>
    </div>
  );
}

const VotingPortalIntroComponent = registerComponent(
  "VotingPortalIntro",
  VotingPortalIntro,
  {styles},
);

declare global {
  interface ComponentTypes {
    VotingPortalIntro: typeof VotingPortalIntroComponent;
  }
}
