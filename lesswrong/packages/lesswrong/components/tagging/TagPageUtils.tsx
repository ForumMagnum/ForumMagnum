import React from "react";
import { Components } from "@/lib/vulcan-lib/components.tsx";
import LWTooltip from "@/components/common/LWTooltip";

export const tagPageHeaderStyles = (theme: ThemeType) => ({
  postListMeta: {
    display: "flex",
    alignItems: "baseline",
    marginBottom: 8,
  },
  relevance: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[600],
    fontWeight: 500,
    textAlign: "right",
    flexGrow: 1,
    marginRight: 8,
  },
});

export const tagPostTerms = (tag: Pick<TagBasicInfo, "_id" | "name"> | null, query: any) => {
  if (!tag) return
  return ({
    ...query,
    filterSettings: {tags:[{tagId: tag._id, tagName: tag.name, filterMode: "Required"}]},
    view: "tagRelevance",
    tagId: tag._id,
  })
}

export const RelevanceLabel = () => (
  <LWTooltip
    title='"Relevance" represents how related the tag is to the post it is tagging. You can vote on relevance below, or by hovering over tags on post pages.'
    placement="bottom-end"
  >
    Relevance
  </LWTooltip>
);
