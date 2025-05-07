import React from "react";
import { Components } from "../../lib/vulcan-lib/components";
import { socialMediaSiteNameToHref } from "../../lib/collections/users/helpers";
import { objectKeys } from "../../lib/utils/typeGuardUtils";
import { useTracking } from "../../lib/analyticsEvents";
import { EMPTY_TEXT_PLACEHOLDER, emptyTextCellStyles } from "./PeopleDirectoryTextCell";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('PeopleDirectorySocialMediaCell', (theme: ThemeType) => ({
  root: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    rowGap: "2px",
  },
  link: {
    color: theme.palette.grey[600],
    "&:hover": {
      opacity: 1,
    },
  },
  icon: {
    width: 20,
    height: 20,
    fill: theme.palette.grey[600],
    "&:hover": {
      fill: theme.palette.grey[800],
    },
  },
  empty: {
    ...emptyTextCellStyles(theme),
  },
}));

export const PeopleDirectorySocialMediaCell = ({user}: {
  user: SearchUser,
}) => {
  const classes = useStyles(styles);
  const {captureEvent} = useTracking();

  const urls = user.socialMediaUrls ?? {};
  const keys = objectKeys(urls);

  const {SocialMediaIcon} = Components;
  return (
    <div className={classes.root}>
      {keys.length < 1 &&
        <span className={classes.empty}>{EMPTY_TEXT_PLACEHOLDER}</span>
      }
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
