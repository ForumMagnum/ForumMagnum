import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from "../../lib/reactRouterWrapper";
import type { ForumIconName } from "../common/ForumIcon";
import { useDismissable } from "../hooks/useDismissable";
import { HIDE_NEW_POST_HOW_TO_GUIDE_COOKIE } from "../../lib/cookies/cookies";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 300,
    margin: "60px 20px 0 -80px",
    position: "relative",
    background: theme.palette.primaryAlpha(0.1),
    color: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 20,
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  dismissButton: {
    position: "absolute",
    right: 18,
    top: 18,
    cursor: "pointer",
    "& svg": {
      width: "0.8em",
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
      color: theme.palette.primary.light,
      opacity: 1,
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
    label: "Guide to norms on the forum",
    url: "/posts/yND9aGJgobm5dEXqF/guide-to-norms-on-the-forum",
  },
  {
    icon: "Document",
    label: "How to import Google Docs",
    url: "/posts/Y8gkABpa9R6ktkhYt/forum-user-manual#Two_different_editors__WYSIWYG_and_Markdown",
  },
];

export const NewPostHowToGuides = ({classes}: {
  classes: ClassesType,
}) => {
  const {dismissed, dismiss} = useDismissable(HIDE_NEW_POST_HOW_TO_GUIDE_COOKIE);
  if (dismissed) {
    return null;
  }

  const {ForumIcon} = Components;
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

const NewPostHowToGuidesComponent = registerComponent(
  "NewPostHowToGuides",
  NewPostHowToGuides,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewPostHowToGuides: typeof NewPostHowToGuidesComponent
  }
}
