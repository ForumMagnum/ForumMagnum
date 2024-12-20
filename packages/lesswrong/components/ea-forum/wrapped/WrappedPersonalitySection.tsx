import React, { useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { WRAPPED_SHARE_BUTTON_WIDTH } from "./WrappedShareButton";
import { useForumWrappedContext } from "./hooks";
import { getWrappedVideo } from "./videos";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    minHeight: "100%",
  },
  container: {
    position: "relative",
    width: "100%",
    minHeight: "100%",
    overflowX: "hidden",
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
  canvas: {
    maxWidth: "100%",
  },
  video: {
    position: "absolute",
    top: -10000,
    left: -10000,
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 40,
    width: "100%",
  },
  bottomMargin: {
    marginBottom: 2,
  },
  share: {
    position: "fixed",
    bottom: 50,
    left: `calc(50% - ${WRAPPED_SHARE_BUTTON_WIDTH / 2}px)`,
    transition: "opacity 0.5s ease-in-out",
  },
  shareHidden: {
    opacity: 0,
    pointerEvents: "none",
  },
});

const WrappedPersonalitySection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    data: {personality},
    thinkingVideoRef,
    personalityVideoRef,
  } = useForumWrappedContext();
  const [video, setVideo] = useState(() => getWrappedVideo("thinking"));
  const [isFinished, setIsFinished] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({width: 200, height: 200});

  const isThinking = video.animation === "thinking";
  const videoRef = isThinking ? thinkingVideoRef : personalityVideoRef;

  useEffect(() => {
    const elem = videoRef.current;
    if (elem) {
      const handler = () => {
        if (isThinking) {
          setVideo(getWrappedVideo(personality));
        } else {
          setIsFinished(true);
        }
      }
      elem.addEventListener("ended", handler);
      return () => elem.removeEventListener("ended", handler);
    }
  }, [videoRef, isThinking, personality]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const video = videoRef.current;
    const container = screenshotRef.current;
    if (canvas && ctx && video && container) {
      const doFrame = () => {
        // Bad alpha blending causes a 1-pixel pseudo border around the canvas.
        // To get around scale up slightly and move the outer-most pixel
        // outside of the canvas. (Sorry)
        ctx.drawImage(video, -1, -1, canvas.width + 2, canvas.height + 2);
        requestAnimationFrame(doFrame);
      }
      const handler = () => {
        const {videoWidth, videoHeight} = video;
        const {clientWidth, clientHeight} = container;
        const scaleByWidth = clientWidth / videoWidth;
        const scaleByHeight = clientHeight / videoHeight;
        const scaleFactor = Math.min(scaleByWidth, scaleByHeight);
        setSize({
          width: videoWidth * scaleFactor,
          height: videoHeight * scaleFactor,
        });
        requestAnimationFrame(doFrame);
      }
      video.addEventListener("play", handler);
      return () => video.removeEventListener("play", handler);
    }
  }, [videoRef]);

  useEffect(() => {
    void videoRef.current?.play();
  }, [videoRef]);

  const {WrappedSection, WrappedHeading, WrappedShareButton} = Components;
  return (
    <WrappedSection
      pageSectionContext="personality"
      className={classNames(classes.root, classes[video.color])}
      noPadding
    >
      <div
        ref={screenshotRef}
        className={classNames(classes.container, classes[video.color])}
      >
        <canvas
          ref={canvasRef}
          width={videoRef.current?.videoWidth}
          height={videoRef.current?.videoHeight}
          style={{width: size.width, height: size.height}}
          className={classes.canvas}
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
      </div>
      <WrappedShareButton
        name="Personality"
        screenshotRef={screenshotRef}
        className={classNames(classes.share, !isFinished && classes.shareHidden)}
      />
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
