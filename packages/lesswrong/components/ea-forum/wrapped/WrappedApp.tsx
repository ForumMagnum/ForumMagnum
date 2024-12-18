import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";
import range from "lodash/range";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  app: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flexGrow: 1,
    overflow: "hidden auto",
    "& > *": {
      maxWidth: 700,
    },
  },
  nav: {
    padding: 16,
    width: "100vw",
    maxWidth: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  navButton: {
    cursor: "pointer",
    padding: 2,
    color: theme.palette.text.alwaysWhite,
    border: `1px solid ${theme.palette.text.alwaysWhite}`,
    borderRadius: "50%",
    aspectRatio: "1/1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": {
      width: 16,
      height: 16,
    },
  },
  navSection: {
    flexGrow: 1,
    height: 4,
    background: theme.palette.text.alwaysWhite,
  },
  navSectionUnviewed: {
    opacity: 0.3,
  },
});

const WrappedApp = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    totalSections,
    currentSection,
    goToPreviousSection,
    goToNextSection,
    CurrentSection,
  } = useForumWrappedContext();
  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.app}>
        <CurrentSection />
      </div>
      <div className={classes.nav}>
        <div className={classes.navButton} onClick={goToPreviousSection}>
          <ForumIcon icon="ChevronLeft" />
        </div>
        {range(0, totalSections).map((i) => (
          <div key={i} className={classNames(
            classes.navSection,
            i > currentSection && classes.navSectionUnviewed,
          )} />
        ))}
        <div className={classes.navButton} onClick={goToNextSection}>
          <ForumIcon icon="ChevronRight" />
        </div>
      </div>
    </div>
  );
}

const WrappedAppComponent = registerComponent(
  "WrappedApp",
  WrappedApp,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedApp: typeof WrappedAppComponent
  }
}
