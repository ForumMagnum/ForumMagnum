import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import { CommonExcerptProps } from "./ContentExcerpt";

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

const TagExcerptInner = ({
  tag,
  ...commonExcerptProps
}: CommonExcerptProps & {
  tag: ExcerptableTag,
}) => {
  const contentHtml = getTagDescriptionHtml(tag);
  if (!contentHtml) {
    return null;
  }

  const {ContentExcerpt} = Components;
  return (
    <ContentExcerpt
      contentHtml={contentHtml}
      moreLink={tagGetUrl(tag)}
      contentType="tag"
      {...commonExcerptProps}
    />
  );
}

export const TagExcerpt = registerComponent(
  "TagExcerpt",
  TagExcerptInner,
);

declare global {
  interface ComponentTypes {
    TagExcerpt: typeof TagExcerpt,
  }
}
