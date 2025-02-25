import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import {
  SocialMediaProfileField,
  profileFieldToSocialMediaHref,
} from "../../lib/collections/users/helpers";
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
      href={profileFieldToSocialMediaHref(field, url)}
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
