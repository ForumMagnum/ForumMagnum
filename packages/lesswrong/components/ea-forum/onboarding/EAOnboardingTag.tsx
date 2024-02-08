import React, { useEffect } from "react";
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
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column-reverse",
    padding: 8,
    backgroundColor: theme.palette.tag.onboardingBackground,
    borderRadius: theme.borderRadius.default,
    border: "1px solid transparent",
    "&:hover": {
      backgroundColor: theme.palette.tag.onboardingBackgroundHover,
    },
  },
  selected: {
    borderColor: theme.palette.primary.dark,
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
  const [subscribed, toggleSubscribed] = useOptimisticToggle(
    isSubscribed ?? false,
    onSubscribe ?? (() => {}),
  );

  const {_id, name, squareImageId, bannerImageId} = tag;

  useEffect(() => {
    onSubscribed?.(_id, subscribed);
  }, [_id, subscribed, onSubscribed]);

  const {CloudinaryImage2} = Components;
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
        className={classes.image}
      />
      <div className={classNames(classes.name, {
        [classes.selected]: subscribed,
      })}>
        {name}
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
