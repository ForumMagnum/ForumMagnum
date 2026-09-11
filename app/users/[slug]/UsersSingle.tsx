"use client";
import type { ForumTypeString } from "@/lib/instanceSettings";
import React from 'react';
import { useLocation } from '@/lib/routeUtil';
import { userGetProfileUrlFromSlug, userGetAbsoluteProfileUrl } from "@/lib/collections/users/helpers";
import { slugify } from '@/lib/utils/slugify';
import PermanentRedirect from "@/components/common/PermanentRedirect";
import ProfilePage from './ProfilePage';

/**
 * Build structured data for a user to help with SEO.
 */
export const getUserStructuredData = (user: UsersProfile, forumType: ForumTypeString) => {
  return {
    "@context": "http://schema.org",
    "@type": "Person",
    "name": user.displayName,
    "url": userGetAbsoluteProfileUrl(user, forumType),
    ...((user.biography?.plaintextDescription) && { "description": user.biography.plaintextDescription }),
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
  };
};


const UsersSingle = ({slug: rawSlug}: {slug: string}) => {
  const { pathname } = useLocation();
  
  const slug = slugify(rawSlug);
  const canonicalUrl = userGetProfileUrlFromSlug(slug);
  if (pathname !== canonicalUrl) {
    // A Javascript redirect, which replaces the history entry (so you don't
    // have a redirector interfering with the back button). Does not cause a
    // pageload.
    return <PermanentRedirect url={canonicalUrl} />;
  } else {
    return <ProfilePage slug={slug} />
  }
};

export default UsersSingle;
