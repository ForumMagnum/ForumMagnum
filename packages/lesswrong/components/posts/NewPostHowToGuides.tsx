import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import type { ForumIconName } from "../common/ForumIcon";
import { Link } from "../../lib/reactRouterWrapper";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "absolute",
    right: 100, // TODO: Proper positioning
    background: theme.palette.primaryAlpha(0.1),
    color: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 20,
    borderRadius: theme.borderRadius.default,
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: 12,
  },
  howToGuide: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 500,
    fontSize: 14,
  },
});

type HowToGuide = {
  icon: ForumIconName,
  label: string,
  url: string,
}

const guides: HowToGuide[] = [
  {
    icon: "Close",
    label: "Import Google Doc with footnotes",
    url: "#",
  },
];

export const NewPostHowToGuides = ({classes}: {
  classes: ClassesType,
}) => {
  const {ForumIcon} = Components;
  return (
    <AnalyticsContext pageElementContext="newPostHowToGuides">
      <div className={classes.root}>
        <div className={classes.title}>How-to guides</div>
        {guides.map(({icon, label, url}) =>
          <Link to={url} className={classes.howToGuide}>
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
