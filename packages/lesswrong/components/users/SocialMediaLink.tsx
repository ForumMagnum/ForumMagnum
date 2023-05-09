import React from "react";
import { combineUrls, registerComponent } from "../../lib/vulcan-lib";
import { socialMediaIconPaths } from "../form-components/PrefixedInput";
import {
  SocialMediaProfileField,
  SOCIAL_MEDIA_PROFILE_FIELDS,
} from "../../lib/collections/users/schema";

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
      href={`https://${combineUrls(SOCIAL_MEDIA_PROFILE_FIELDS[field], url)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg viewBox="0 0 24 24" className={className}>
        {socialMediaIconPaths[field]}
      </svg>
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
