import React, { useCallback, MouseEvent } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useOptimisticToggle } from "../../hooks/useOptimisticToggle";
import classNames from "classnames";
import { useEAOnboarding } from "./useEAOnboarding";
import { useSubscribeUserToTag } from '@/components/hooks/useFilterSettings';
import CloudinaryImage2 from "../../common/CloudinaryImage2";
import ForumIcon from "../../common/ForumIcon";

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
    backgroundColor: theme.palette.tag.onboardingBackgroundSelected,
    borderColor: theme.palette.panelBackground.modalBackground,
    padding: 6,
    margin: 2,
    width: TAG_SIZE - 4,
    height: TAG_SIZE - 4,
    "&:hover": {
      backgroundColor: theme.palette.tag.onboardingBackground,
    },
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
  tag: UserOnboardingTag,
  onSubscribed?: (id: string, subscribed: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {viewAsAdmin} = useEAOnboarding();

  const { isSubscribed, subscribeUserToTag } = useSubscribeUserToTag(tag)

  // If viewAsAdmin is true, then this is an admin testing
  // and we don't want any real updates to happen
  const subscribedCallback = useCallback((
    _e: MouseEvent<HTMLDivElement>,
    newValue: boolean,
  ) => {
    !viewAsAdmin && void subscribeUserToTag(tag, newValue ? "Subscribed" : "Default")
    onSubscribed?.(tag._id, newValue);
  }, [onSubscribed, subscribeUserToTag, tag, viewAsAdmin]);

  const [subscribed, toggleSubscribed] = useOptimisticToggle(
    viewAsAdmin ? false : (isSubscribed ?? false),
    subscribedCallback,
  );

  const {name, squareImageId, bannerImageId} = tag;
  return (
    <div onClick={toggleSubscribed} className={classes.root}>
      <CloudinaryImage2
        publicId={squareImageId ?? bannerImageId ?? ''}
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

export default registerComponent(
  "EAOnboardingTag",
  EAOnboardingTag,
  {styles},
);


