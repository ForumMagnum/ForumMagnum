import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { SOCIAL_MEDIA_PROFILE_FIELDS, SocialMediaProfileField, profileFieldToSocialMediaHref } from '../../lib/collections/users/helpers';

const styles = defineStyles("SunshineNewUserExternalLinks", (theme) => ({
  link: {
    color: theme.palette.primary.main,
  },
}));

const profileLinkLabels: Record<SocialMediaProfileField, string> = {
  linkedinProfileURL: 'LinkedIn',
  facebookProfileURL: 'Facebook',
  twitterProfileURL: 'Twitter',
  githubProfileURL: 'GitHub',
  blueskyProfileURL: 'Bluesky',
};

const SunshineNewUserExternalLinks = ({ user }: {
  user: SunshineUsersList,
}) => {
  const classes = useStyles(styles);

  return (
    <>
      {user.website && (
        <div>
          Website: <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.link}>{user.website}</a>
        </div>
      )}
      {(Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS) as SocialMediaProfileField[]).map(field => {
        const value = user[field];
        if (!value) return null;
        const url = profileFieldToSocialMediaHref(field, value);
        const label = profileLinkLabels[field];
        return (
          <div key={field}>
            {label}: <a href={url} target="_blank" rel="noopener noreferrer" className={classes.link}>{url}</a>
          </div>
        );
      })}
    </>
  );
};

export default registerComponent('SunshineNewUserExternalLinks', SunshineNewUserExternalLinks);
