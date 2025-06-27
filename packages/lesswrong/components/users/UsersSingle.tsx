"use client";

import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { userGetProfileUrl, userGetProfileUrlFromSlug } from "../../lib/collections/users/helpers";
import { isFriendlyUI } from '../../themes/forumTheme';
import { slugify } from '@/lib/utils/slugify';
import PermanentRedirect from "../common/PermanentRedirect";
import FriendlyUsersProfile from "./FriendlyUsersProfile";
import UsersProfile from "./UsersProfile";

/**
 * Build structured data for a user to help with SEO.
 */
export const getUserStructuredData = (user: UsersProfile) => {
  return {
    "@context": "http://schema.org",
    "@type": "Person",
    "name": user.displayName,
    "url": userGetProfileUrl(user, true),
    ...((user.biography?.plaintextDescription) && { "description": user.biography.plaintextDescription }),
    ...((user.jobTitle) && { "jobTitle": user.jobTitle }),
    ...(user.organization && {
      "worksFor": {
        "@type": "Organization",
        "name": user.organization,
      }
    }),
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": {
          "@type": "http://schema.org/LikeAction",
        },
        "userInteractionCount": user.karma,
      },
      {
        "@type": "InteractionCounter",
        "interactionType": {
          "@type": "http://schema.org/WriteAction",
        },
        "userInteractionCount": user.postCount,
      },
    ],
    "memberSince": new Date(user.createdAt).toISOString(),
    ...((user.howOthersCanHelpMe?.plaintextDescription) && { "seeks": user.howOthersCanHelpMe.plaintextDescription }),
    ...((user.howICanHelpOthers?.plaintextDescription) && { "offers": user.howICanHelpOthers.plaintextDescription }),
  };
};


const UsersSingle = () => {
  const { params, pathname } = useLocation();
  
  const slug = slugify(params.slug);
  const canonicalUrl = userGetProfileUrlFromSlug(slug);
  if (pathname !== canonicalUrl) {
    // A Javascript redirect, which replaces the history entry (so you don't
    // have a redirector interfering with the back button). Does not cause a
    // pageload.
    return <PermanentRedirect url={canonicalUrl} />;
  } else {
    return isFriendlyUI ?
      <FriendlyUsersProfile terms={{view: 'usersProfile', slug}} slug={slug} /> :
      <UsersProfile terms={{view: 'usersProfile', slug}} slug={slug} />
  }
};

export default registerComponent('UsersSingle', UsersSingle);


