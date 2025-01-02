import React, { useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { WRAPPED_SHARE_BUTTON_WIDTH } from "./WrappedShareButton";
import { useIsAboveBreakpoint } from "@/components/hooks/useScreenWidth";
import { useForumWrappedContext } from "./hooks";
import { getWrappedVideo } from "./videos";
import { createWrappedVideoCanvas } from "./wrappedGL";
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 0 90px',
  },
  transparent: {},
  grey: {
    background: theme.palette.wrapped.personality.grey,
  },
  red: {
    background: theme.palette.wrapped.personality.red,
  },
  blue: {
    background: theme.palette.wrapped.personality.blue,
  },
  green: {
    background: theme.palette.wrapped.personality.green,
  },
  canvasContainer: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
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
    width: "100%",
  },
  personalityText: {
    fontSize: 38,
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
  const isDesktop = useIsAboveBreakpoint("md");

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
    const videoEl = videoRef.current;
    const container = screenshotRef.current;
    if (canvas && videoEl && container) {
      try {
        const renderFrame = createWrappedVideoCanvas(
          canvas,
          videoEl,
          video.brightness,
        );
        const handler = () => {
          const {videoWidth, videoHeight} = videoEl;
          const {clientWidth, clientHeight} = container;
          const maxSize = isDesktop ? 600 : 400;
          const rootHeight = isDesktop ? clientHeight * 0.75 : clientHeight * 0.5;
          const scaleByWidth = Math.min(clientWidth, maxSize) / videoWidth;
          const scaleByHeight = Math.min(rootHeight, maxSize) / videoHeight;
          const scaleFactor = Math.min(scaleByWidth, scaleByHeight);
          setSize({
            width: videoWidth * scaleFactor,
            height: videoHeight * scaleFactor,
          });
          const doFrame = () => {
            renderFrame();
            if (videoEl && !videoEl.ended) {
              requestAnimationFrame(doFrame);
            }
          }
          requestAnimationFrame(doFrame);
        }
        videoEl.addEventListener("play", handler);
        return () => videoEl.removeEventListener("play", handler);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error displaying wrapped video:", e);
      }
    }
  }, [videoRef, video.animation, video.brightness, isDesktop]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      void video.play();
    }
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
              <WrappedHeading className={classes.personalityText}>
                {personality}
              </WrappedHeading>
            </>
          }
        </div>
        <div className={classes.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={videoRef.current?.videoWidth}
            height={videoRef.current?.videoHeight}
            style={{
              width: size.width,
              height: size.height,
            }}
            className={classes.canvas}
          />
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
