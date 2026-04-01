import React from "react";
import { tagGetPageUrl } from "../../../lib/collections/tags/helpers";
import ContentExcerpt, { CommonExcerptProps } from "./ContentExcerpt";

type ExcerptableTag =
  TagRecentDiscussion |
  TagPreviewFragment |
  TagSectionPreviewFragment;

export const getTagDescriptionHtml = (tag: ExcerptableTag) => {
  if (!tag.description) {
    return undefined;
  }

  if ("htmlHighlight" in tag.description) {
    return tag.description.htmlHighlight;
  }

  return tag.description.htmlHighlightStartingAtHash;
}

const TagExcerpt = ({
  tag,
  ...commonExcerptProps
}: CommonExcerptProps & {
  tag: ExcerptableTag,
}) => {
  const contentHtml = getTagDescriptionHtml(tag);
  if (!contentHtml) {
    return null;
  }
  return (
    <ContentExcerpt
      contentHtml={contentHtml}
      moreLink={tagGetPageUrl(tag)}
      contentType="tag"
      {...commonExcerptProps}
    />
  );
}

export default TagExcerpt;
