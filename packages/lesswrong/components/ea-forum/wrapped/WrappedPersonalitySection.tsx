import React, { useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";
import { getWrappedVideo } from "./videos";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    minHeight: "100%",
  },
  black: {
    background: theme.palette.wrapped.darkBackground,
  },
  grey: {
    background: theme.palette.wrapped.personalityGrey,
  },
  red: {
    background: theme.palette.wrapped.personalityRed,
  },
  blue: {
    background: theme.palette.wrapped.personalityBlue,
  },
  green: {
    background: theme.palette.wrapped.personalityGreen,
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
  },
  content: {
    position: "relative",
  },
  bottomMargin: {
    marginBottom: 2,
  },
});

const WrappedPersonalitySection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {data: {personality}} = useForumWrappedContext();
  const [video, setVideo] = useState(() => getWrappedVideo("thinking"));
  const videoRef = useRef<HTMLVideoElement>(null);

  const isThinking = video.animation === "thinking";

  useEffect(() => {
    const elem = videoRef.current;
    if (elem && isThinking) {
      const handler = () => {
        setVideo(getWrappedVideo(personality));
      }
      elem.addEventListener("ended", handler);
      return () => elem.removeEventListener("ended", handler);
    }
  }, [isThinking, personality]);

  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection
      pageSectionContext="personality"
      className={classNames(classes.root, classes[video.color])}
    >
      <video
        src={video.src}
        ref={videoRef}
        className={classes.video}
        autoPlay
        muted
      />
      <div className={classes.content}>
        {isThinking &&
          <WrappedHeading>
            Your EA Forum personality is...
          </WrappedHeading>
        }
        {!isThinking &&
          <>
            <div className={classes.bottomMargin}>
              Your EA Forum personality is
            </div>
            <WrappedHeading>
              {personality}
            </WrappedHeading>
          </>
        }
      </div>
    </WrappedSection>
  );
}

const WrappedPersonalitySectionComponent = registerComponent(
  "WrappedPersonalitySection",
  WrappedPersonalitySection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedPersonalitySection: typeof WrappedPersonalitySectionComponent
  }
}
