import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { Link } from "../../../lib/reactRouterWrapper";
import { CAREER_STAGES, SOCIAL_MEDIA_PROFILE_FIELDS, SocialMediaProfileField } from "@/lib/collections/users/helpers";
import { getCommunityPath } from '@/lib/pathConstants';
import ContentStyles from "../../common/ContentStyles";
import ForumIcon from "../../common/ForumIcon";
import FormatDate from "../../common/FormatDate";
import SocialMediaLink from "../../users/SocialMediaLink";
import LWTooltip from "../../common/LWTooltip";
import SocialMediaIcon from "../../icons/SocialMediaIcon";

const styles = (theme: ThemeType) => ({
  iconsRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 24,
    rowGap: "10px",
    color: theme.palette.grey[600],
    fontSize: 14,
    lineHeight: "14px",
    marginTop: 22,
    "& a": {
      color: theme.palette.grey[600],
      "&:hover": {
        color: theme.palette.grey[600],
      },
      "&:visited": {
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
  classes: ClassesType<typeof styles>,
}) => {
  const userKarma = user.karma;
  const userHasSocialMedia = Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).some(
    (field: SocialMediaProfileField) => user[field],
  );
  return (
    <ContentStyles contentType="comment" className={classes.iconsRow}>
      <LWTooltip title={`${userKarma} karma`}>
        <span className={classes.userMetaInfo} id='karma-info'>
          <ForumIcon icon="Karma" className={classes.userMetaInfoIcon} />
          {userKarma} karma
        </span>
      </LWTooltip>
      <span className={classes.userMetaInfo}>
        <ForumIcon icon="CalendarDays" className={classes.userMetaInfoIcon} />
        <span>Joined <FormatDate date={user.createdAt} format={'MMM YYYY'} /></span>
      </span>
      {user.careerStage?.map((stage) => {
        const data = CAREER_STAGES.find(({value}) => value === stage);
        return data
          ? (
            <span className={classes.userMetaInfo} key={stage}>
              <ForumIcon icon={data.icon} className={classes.userMetaInfoIcon} />
              <span>{data.label}</span>
            </span>
          )
          : null;
      })}
      {user.mapLocation &&
        <Link to={`${getCommunityPath()}#individuals`} className={classes.userMetaInfo}>
          <ForumIcon icon="MapPin" className={classes.userMetaInfoIcon} />
          {user.mapLocation.formatted_address}
        </Link>
      }
      {userHasSocialMedia &&
        <div className={classes.socialMediaIcons}>
          {
            Object
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
          <SocialMediaIcon name="website" className={classes.websiteIcon}/>
          {user.website}
        </a>
      }
    </ContentStyles>
  );
}

export default registerComponent(
  "EAUsersMetaInfo",
  EAUsersMetaInfo,
  {styles},
);


