import React, {
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { captureException } from "@sentry/core";
import { useTheme } from "@/components/themes/useTheme";
import WrappedShareButton, { WRAPPED_SHARE_BUTTON_WIDTH } from "./WrappedShareButton";
import { useForumWrappedContext } from "./hooks";
import { getWrappedVideo } from "./videos";
import classNames from "classnames";
import WrappedSection from "./WrappedSection";
import WrappedHeading from "./WrappedHeading";

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    minHeight: "100%",
  },
  container: {
    position: "relative",
    width: "100%",
    minHeight: "100%",
    overflow: "hidden",
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
  videoContainer: {
    overflow: "hidden",
  },
  video: {
    maxWidth: "calc(min(100%, 400px))",
    width: "auto",
    height: "auto",
    margin: "0 auto",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "calc(min(100%, 300px))",
    },
  },
  videoThinking: {
    marginTop: -80,
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
  screenshotContainer: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 500,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px 90px",
  },
  screenshotImage: {
    width: "100%",
    marginTop: 8,
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
  const videoDisplayRef = useRef<HTMLVideoElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const isThinking = video.animation === "thinking";
  const videoRef = isThinking ? thinkingVideoRef : personalityVideoRef;

  useEffect(() => {
    setTimeout(() => {
      setIsFinished(true);
    }, 8000);
  }, []);

  useEffect(() => {
    const displayElem = videoDisplayRef.current;
    if (displayElem) {
      const handler = () => {
        if (isThinking) {
          setVideo(getWrappedVideo(personality));
        }
      }
      displayElem.addEventListener("ended", handler);
      return () => displayElem.removeEventListener("ended", handler);
    }
  }, [isThinking, personality]);

  const src = videoRef.current?.src;

  // When we change the video source we have to explicitly tell the video to
  // load otherwise it won't play (this is a known bug in mobile safari)
  useEffect(() => {
    const videoDisplayElement = videoDisplayRef.current;
    if (src && videoDisplayElement) {
      void (async () => {
        try {
          videoDisplayElement.load();
          await videoDisplayElement.play();
        } catch (e) {
          const err = new Error("Wrapped video play error", {cause: e});
          captureException(err);
          // eslint-disable-next-line no-console
          console.error(err);
        }
      })();
    }
  }, [src]);

  const onContextMenu = useCallback((ev: MouseEvent<HTMLVideoElement>) => {
    ev.preventDefault();
  }, []);

  const onError = useCallback((e: SyntheticEvent<HTMLVideoElement, Event>) => {
    const err = new Error("Wrapped video callback error", {
      cause: e as AnyBecauseHard,
    });
    captureException(err);
    // eslint-disable-next-line no-console
    console.error(err);
  }, []);

  const personalityVideo = getWrappedVideo(personality);

  // There's a horrible line of white background at the bottom of the image
  // because of a bug in html2canvas - cover it up
  const onRendered = useCallback((canvas: HTMLCanvasElement) => {
    try {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const coverHeight = 4;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = theme.palette.wrapped.personality[personalityVideo.color];
        ctx.fillRect(0, canvas.height - coverHeight, canvas.width, coverHeight * 2);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }, [personalityVideo.color, theme]);
  const personalityTitle = (
    <>
      <div className={classes.bottomMargin}>
        Your EA Forum personality is
      </div>
      <WrappedHeading className={classes.personalityText}>
        {personality}
      </WrappedHeading>
    </>
  );

  return (
    <WrappedSection
      pageSectionContext="personality"
      className={classNames(classes.root, classes[video.color])}
      noPadding
    >
      <div className={classNames(classes.container, classes[video.color])}>
        <div className={classes.content}>
          {isThinking &&
            <WrappedHeading>
              Your EA Forum personality is...
            </WrappedHeading>
          }
          {!isThinking && personalityTitle}
        </div>
        <div
          style={{filter: `brightness(${video.brightness})`}}
          className={classes.videoContainer}
        >
          <video
            ref={videoDisplayRef}
            src={src}
            loop={!isThinking}
            onContextMenu={onContextMenu}
            onError={onError}
            muted
            playsInline
            autoPlay
            preload="auto"
            className={classNames(
              classes.video,
              isThinking && classes.videoThinking,
            )}
          />
        </div>
      </div>
      <WrappedShareButton
        name="Personality"
        screenshotRef={screenshotRef}
        onRendered={onRendered}
        className={classNames(classes.share, !isFinished && classes.shareHidden)}
      />
      <div
        ref={screenshotRef}
        className={classNames(classes.screenshotContainer, classes[video.color])}
      >
        {personalityTitle}
        <img
          src={personalityVideo.frame}
          crossOrigin="anonymous"
          className={classes.screenshotImage}
        />
      </div>
    </WrappedSection>
  );
}

export default registerComponent(
  "WrappedPersonalitySection",
  WrappedPersonalitySection,
  {styles},
);


