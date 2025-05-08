import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from "../../lib/reactRouterWrapper";
import { ForumIconName, ForumIcon } from "../common/ForumIcon";
import { useDismissable } from "../hooks/useDismissable";
import { HIDE_NEW_POST_HOW_TO_GUIDE_COOKIE } from "../../lib/cookies/cookies";

/**
 * Styles are shared with `NewTagInfoBox`
 */
export const styles = (theme: ThemeType) => ({
  root: {
    width: 280,
    margin: "60px 20px 0 -60px",
    position: "relative",
    background: theme.palette.background.primaryTranslucent,
    color: theme.palette.text.primaryAlert,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 20,
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  dismissButton: {
    position: "absolute",
    right: 16,
    top: 16,
    cursor: "pointer",
    "& svg": {
      width: "0.8em",
    },
    "&:hover": {
      color: theme.palette.primary.dark,
    },
  },
  title: {
    fontWeight: 700,
    fontSize: 16,
    paddingBottom: 6,
  },
  howToGuide: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: 500,
    fontSize: 14,
    marginTop: 14,
    "& svg": {
      fontSize: "1.5em",
    },
    "&:hover": {
      opacity: 1,
      textDecoration: 'underline',
    },
  },
});

type HowToGuide = {
  icon: ForumIconName,
  label: string,
  url: string,
}

const guides: HowToGuide[] = [
  {
    icon: "BookOpen",
    label: "Forum user manual",
    url: "/posts/Y8gkABpa9R6ktkhYt/forum-user-manual",
  },
  {
    icon: "ChatBubbleLeftRight",
    label: "Guide to norms on the Forum",
    url: "/posts/yND9aGJgobm5dEXqF/guide-to-norms-on-the-forum",
  },
];

export const NewPostHowToGuidesInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {dismissed, dismiss} = useDismissable(HIDE_NEW_POST_HOW_TO_GUIDE_COOKIE);
  if (dismissed) {
    return null;
  }
  return (
    <AnalyticsContext pageElementContext="newPostHowToGuides">
      <div className={classes.root}>
        <div className={classes.title}>Useful links</div>
        <div
          className={classes.dismissButton}
          onClick={dismiss}
          role="button"
        >
          <ForumIcon icon="Close" />
        </div>
        {guides.map(({icon, label, url}) =>
          <Link to={url} className={classes.howToGuide} key={label}>
            <ForumIcon icon={icon} /> {label}
          </Link>
        )}
      </div>
    </AnalyticsContext>
  );
}

export const NewPostHowToGuides = registerComponent(
  "NewPostHowToGuides",
  NewPostHowToGuidesInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewPostHowToGuides: typeof NewPostHowToGuides
  }
}
