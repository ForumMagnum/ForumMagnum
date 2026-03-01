"use client";
import React from "react";
import { useLocation } from "../../lib/routeUtil";
import LWTagPage from "./LWTagPage";

/**
 * Build structured data for a tag to help with SEO.
 */
export const getTagStructuredData = (tag: TagPageFragment | TagPageWithRevisionFragment) => {
  const hasSubTags = !!tag.subTags && tag.subTags.length > 0;

  return {
    "@context": "http://schema.org",
    "@type": "WebPage",
    "name": tag.name,
    ...(hasSubTags && { "mentions": tag.subTags.map((subtag) => ({
        "@type": "Thing",
        "name": subtag.name,
      }))
    }),
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "http://schema.org/WriteAction",
      "userInteractionCount": tag.postCount,
    },
  };
};


/**
 * Wrapper component for routing to either the subforum page or the ordinary tag page.
 */
const TagPageRouter = ({slug}: {slug: string}) => {
  const { query } = useLocation();

  return <LWTagPage slug={slug}/>;
}

export default TagPageRouter;
