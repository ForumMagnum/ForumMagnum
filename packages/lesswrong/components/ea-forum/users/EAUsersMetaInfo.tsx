import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import {
  SocialMediaProfileField,
  SOCIAL_MEDIA_PROFILE_FIELDS,
} from "../../../lib/collections/users/schema";


// TODO
import Tooltip from "@material-ui/core/Tooltip";
import CalendarIcon from '@material-ui/icons/Today'
import LocationIcon from '@material-ui/icons/LocationOn'
import { socialMediaIconPaths } from "../../form-components/PrefixedInput";

const styles = (theme: ThemeType): JssStyles => ({
  iconsRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 24,
    rowGap: "10px",
    color: theme.palette.grey[600],
    fontSize: 14,
    lineHeight: "14px",
    marginTop: 10,
    "& a": {
      color: theme.palette.grey[600],
      "&:hover": {
        color: theme.palette.grey[600],
      }
    }
  },
  userMetaInfo: {
    display: "flex",
    alignItems: "center",
    columnGap: 5,
  },
  userMetaInfoIcon: {
    fontSize: 18,
  },
  socialMediaIcons: {
    display: "flex",
    columnGap: 10,
  },
  socialMediaIcon: {
    flex: "none",
    height: 20,
    fill: theme.palette.grey[600],
  },
  website: {
    display: "inline-flex",
    justifyContent: "center",
    wordBreak: "break-all",
    lineHeight: "20px",
  },
  websiteIcon: {
    flex: "none",
    height: 20,
    fill: theme.palette.grey[600],
    marginRight: 4
  },
});

const EAUsersMetaInfo = ({user, classes}: {
  user: UsersProfile,
  classes: ClassesType,
}) => {
  const userKarma = user.karma ?? 0;
  const userHasSocialMedia = Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).some(
    (field: SocialMediaProfileField) => user[field],
  );

  const {ContentStyles, ForumIcon, FormatDate, SocialMediaLink} = Components;

  return (
    <ContentStyles contentType="comment" className={classes.iconsRow}>
      <Tooltip title={`${userKarma} karma`}>
        <span className={classes.userMetaInfo}>
          <ForumIcon icon="Karma" className={classes.userMetaInfoIcon} />
          {userKarma}
        </span>
      </Tooltip>
      {user.mapLocation &&
        <Link to="/community#individuals" className={classes.userMetaInfo}>
          <LocationIcon className={classes.userMetaInfoIcon} />
          {user.mapLocation.formatted_address}
        </Link>
      }
      <span className={classes.userMetaInfo}>
        <CalendarIcon className={classes.userMetaInfoIcon} />
        <span>Joined <FormatDate date={user.createdAt} format={'MMM YYYY'} /></span>
      </span>
      {userHasSocialMedia &&
        <div className={classes.socialMediaIcons}>
          {Object
            .keys(SOCIAL_MEDIA_PROFILE_FIELDS)
            .map((field: SocialMediaProfileField) =>
              <SocialMediaLink
                key={field}
                user={user}
                field={field}
                className={classes.socialMediaIcon}
              />
            )
          }
        </div>
      }
      {user.website &&
        <a
          href={`https://${user.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.website}
        >
          <svg viewBox="0 0 24 24" className={classes.websiteIcon}>
            {socialMediaIconPaths.website}
          </svg>
        {user.website}
        </a>
      }
    </ContentStyles>
  );
}

const EAUsersMetaInfoComponent = registerComponent(
  "EAUsersMetaInfo",
  EAUsersMetaInfo,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAUsersMetaInfo: typeof EAUsersMetaInfoComponent
  }
}
