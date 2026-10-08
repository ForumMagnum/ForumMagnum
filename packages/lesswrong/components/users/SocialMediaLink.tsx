import React from "react";
import {
  SocialMediaProfileField,
  profileFieldToSocialMediaHref,
} from "../../lib/collections/users/helpers";
import SocialMediaIcon from "../icons/SocialMediaIcon";

const iconNameByUserFieldName: Record<SocialMediaProfileField|"website", SocialMediaSiteName> = {
  "linkedinProfileURL": "linkedin",
  "facebookProfileURL": "facebook",
  "blueskyProfileURL": "bluesky",
  "twitterProfileURL": "twitter",
  "githubProfileURL": "github",
  "website": "website",
};

const SocialMediaLink = ({user, field, className}: {
  user: UsersProfile,
  field: SocialMediaProfileField,
  className?: string,
}) => {
  const url = user[field];
  if (!url) {
    return null;
  }

  return (
    <a
      href={profileFieldToSocialMediaHref(field, url)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <SocialMediaIcon name={iconNameByUserFieldName[field]} className={className}/>
    </a>
  );
}

export default SocialMediaLink;


