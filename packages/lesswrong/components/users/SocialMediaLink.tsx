import React from "react";
import { combineUrls, Components, registerComponent } from "../../lib/vulcan-lib";
import { SocialMediaProfileField, SOCIAL_MEDIA_PROFILE_FIELDS, } from "../../lib/collections/users/schema";
import { iconNameByUserFieldName } from '../form-components/PrefixedInput';

const SocialMediaLink = ({user, field, className}: {
  user: UsersProfile,
  field: SocialMediaProfileField,
  className?: string,
}) => {
  const { SocialMediaIcon } = Components;
  const url = user[field];
  if (!url) {
    return null;
  }

  return (
    <a
      href={`https://${combineUrls(SOCIAL_MEDIA_PROFILE_FIELDS[field], url)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <SocialMediaIcon name={iconNameByUserFieldName[field]} className={className}/>
    </a>
  );
}

const SocialMediaLinkComponent = registerComponent(
  "SocialMediaLink",
  SocialMediaLink,
);

declare global {
  interface ComponentTypes {
    SocialMediaLink: typeof SocialMediaLinkComponent
  }
}
