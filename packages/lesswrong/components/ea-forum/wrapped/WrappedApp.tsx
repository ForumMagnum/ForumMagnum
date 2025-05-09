import React, { useEffect } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useForumWrappedContext } from "./hooks";
import { getWrappedVideo } from "./videos";
import { Helmet } from "@/lib/utils/componentsWithChildren";
import range from "lodash/range";
import classNames from "classnames";
import { ForumIcon } from "../../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    height: "100%",
  },
  app: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflow: "hidden auto",
  },
  offscreenVideos: {
    position: "absolute",
    left: -10000,
    top: -10000,
  },
  navContainer: {
    position: "fixed",
    bottom: 0,
    padding: 16,
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    width: 500,
    maxWidth: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px",
  },
  navButton: {
    cursor: "pointer",
    padding: 6,
    margin: 8,
    color: theme.palette.text.alwaysWhite,
    border: `1px solid ${theme.palette.text.alwaysWhite}`,
    borderRadius: "50%",
    aspectRatio: "1/1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all ease-in-out 0.2s",
    "& svg": {
      width: 16,
      height: 16,
    },
    "&:hover": {
      backgroundColor: theme.palette.text.alwaysWhite,
      color: theme.palette.text.alwaysBlack,
    },
  },
  navSection: {
    width: 8,
    height: 8,
    background: theme.palette.text.alwaysWhite,
    borderRadius: "50%",
  },
  navSectionInactive: {
    opacity: 0.3,
  },
});

const WrappedAppInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    data: {personality},
    totalSections,
    currentSection,
    goToPreviousSection,
    goToNextSection,
    CurrentSection,
    thinkingVideoRef,
    personalityVideoRef,
  } = useForumWrappedContext();

  useEffect(() => {
    const handler = ({ target, key }: KeyboardEvent) => {
      // Disable the arrow navigation when we're typing in a text box
      if ((target as HTMLElement)?.getAttribute?.("contenteditable") === "true") {
        return;
      }
      switch (key) {
        case "ArrowLeft":  goToPreviousSection(); break;
        case "ArrowRight": goToNextSection();     break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToPreviousSection, goToNextSection]);

  const thinkingVideo = getWrappedVideo("thinking");
  const personalityVideo = getWrappedVideo(personality);
  return (
    <div className={classes.root}>
      <Helmet>
        <link rel="prefetch" href={personalityVideo.frame} crossOrigin="anonymous" />
      </Helmet>
      <div className={classes.app}>
        <div className={classes.offscreenVideos}>
          {/* Preload videos offscreen so they'll be ready when we need them */}
          <video
            src={thinkingVideo.src}
            ref={thinkingVideoRef}
            muted
            playsInline
            preload="auto"
          />
          <video
            src={personalityVideo.src}
            ref={personalityVideoRef}
            muted
            playsInline
            preload="auto"
          />
        </div>
        <CurrentSection />
      </div>
      {currentSection > 0 &&
        <div className={classes.navContainer}>
          <div className={classes.nav}>
            <div className={classes.navButton} onClick={goToPreviousSection}>
              <ForumIcon icon="ChevronLeft" />
            </div>
            {range(1, totalSections).map((i) => (
              <div key={i} className={classNames(
                classes.navSection,
                i !== currentSection && classes.navSectionInactive,
              )} />
            ))}
            <div className={classes.navButton} onClick={goToNextSection}>
              <ForumIcon icon="ChevronRight" />
            </div>
          </div>
        </div>
      }
    </div>
  );
}

export const WrappedApp = registerComponent(
  "WrappedApp",
  WrappedAppInner,
  {styles},
);


