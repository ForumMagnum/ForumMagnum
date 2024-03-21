import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { socialMediaSiteNameToHref } from "../../lib/collections/users/helpers";
import { objectKeys } from "../../lib/utils/typeGuardUtils";
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    gap: "12px",
  },
  link: {
    color: theme.palette.grey[600],
    "&:hover": {
      opacity: 1,
    },
  },
  icon: {
    width: 16,
    height: 16,
    fill: theme.palette.grey[600],
    "&:hover": {
      fill: theme.palette.grey[800],
    },
  },
});

export const PeopleDirectorySocialMediaCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();

  const urls = user.socialMediaUrls ?? {};
  const keys = objectKeys(urls)

  const {SocialMediaIcon} = Components;
  return (
    <div className={classes.root}>
      {keys.length < 1 && "-"}
      {keys.map((field) => {
        const url = urls[field];
        if (!url) {
          return null;
        }
        const href = socialMediaSiteNameToHref(field, url);
        return (
          <a
            key={field}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => captureEvent("socialMediaClick", {
              field,
              href,
              userUrl: url,
              targetUserId: user._id,
            })}
            className={classes.link}
          >
            <SocialMediaIcon name={field} className={classes.icon} />
          </a>
        );
      })}
    </div>
  );
}

const PeopleDirectorySocialMediaCellComponent = registerComponent(
  "PeopleDirectorySocialMediaCell",
  PeopleDirectorySocialMediaCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectorySocialMediaCell: typeof PeopleDirectorySocialMediaCellComponent
  }
}
