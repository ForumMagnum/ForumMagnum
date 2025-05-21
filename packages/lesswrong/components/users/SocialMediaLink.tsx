import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import {
  SocialMediaProfileField,
  profileFieldToSocialMediaHref,
} from "../../lib/collections/users/helpers";
import { iconNameByUserFieldName } from '../form-components/PrefixedInput';
import SocialMediaIcon from "../icons/SocialMediaIcon";

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

export default registerComponent(
  "SocialMediaLink",
  SocialMediaLink,
);


