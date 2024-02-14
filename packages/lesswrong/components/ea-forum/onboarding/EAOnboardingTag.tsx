import React, { useCallback, MouseEvent } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useNotifyMe } from "../../hooks/useNotifyMe";
import { useOptimisticToggle } from "../../hooks/useOptimisticToggle";
import classNames from "classnames";

const TAG_SIZE = 103;

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    userSelect: "none",
    width: TAG_SIZE,
    height: TAG_SIZE,
    position: "relative",
  },
  image: {
    zIndex: 1,
    position: "absolute",
    borderRadius: theme.borderRadius.default,
  },
  name: {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: "16px",
    color: theme.palette.text.alwaysWhite,
    zIndex: 2,
    position: "relative",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column-reverse",
    padding: 8,
    backgroundColor: theme.palette.tag.onboardingBackground,
    borderRadius: theme.borderRadius.default,
    border: "4px solid transparent",
    "&:hover": {
      backgroundColor: theme.palette.tag.onboardingBackgroundHover,
    },
  },
  imageSelected: {
    border: `3px solid ${theme.palette.primary.dark}`,
  },
  nameSelected: {
    borderColor: theme.palette.panelBackground.modalBackground,
    padding: 6,
    margin: 2,
    width: TAG_SIZE - 4,
    height: TAG_SIZE - 4,
  },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: theme.palette.primary.dark,
    borderRadius: theme.borderRadius.small,
    width: 18,
    height: 18,
  },
});

export const EAOnboardingTag = ({tag, onSubscribed, classes}: {
  tag: TagOnboarding,
  onSubscribed?: (id: string, subscribed: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {isSubscribed, onSubscribe} = useNotifyMe({
    document: tag,
    overrideSubscriptionType: "newTagPosts",
    hideFlashes: true,
  });

  const subscribedCallback = useCallback((
    e: MouseEvent<HTMLDivElement>,
    newValue: boolean,
  ) => {
    void onSubscribe?.(e);
    onSubscribed?.(tag._id, newValue);
  }, [onSubscribe, onSubscribed, tag._id]);

  const [subscribed, toggleSubscribed] = useOptimisticToggle(
    isSubscribed ?? false,
    subscribedCallback,
  );

  const {name, squareImageId, bannerImageId} = tag;
  const {CloudinaryImage2, ForumIcon} = Components;
  return (
    <div onClick={toggleSubscribed} className={classes.root}>
      <CloudinaryImage2
        publicId={squareImageId ?? bannerImageId}
        width={TAG_SIZE}
        height={TAG_SIZE}
        imgProps={{
          dpr: String(window.devicePixelRatio ?? 1),
          g: "center",
        }}
        objectFit="cover"
        className={classNames(classes.image, {
          [classes.imageSelected]: subscribed,
        })}
      />
      <div className={classNames(classes.name, {
        [classes.nameSelected]: subscribed,
      })}>
        {name}
        {subscribed && <ForumIcon icon="Check" className={classes.check} />}
      </div>
    </div>
  );
}

const EAOnboardingTagComponent = registerComponent(
  "EAOnboardingTag",
  EAOnboardingTag,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingTag: typeof EAOnboardingTagComponent
  }
}