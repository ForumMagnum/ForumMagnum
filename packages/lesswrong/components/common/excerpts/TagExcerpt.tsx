import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";

const TagExcerpt = ({tag, lines = 3, className}: {
  tag: TagRecentDiscussion,
  lines?: number,
  className?: string,
}) => {
  const contentHtml = tag.description?.htmlHighlight;
  if (!contentHtml) {
    return null;
  }

  const {ContentExcerpt} = Components;
  return (
    <ContentExcerpt
      contentHtml={contentHtml}
      moreLink={tagGetUrl(tag)}
      contentType="tag"
      lines={lines}
      className={className}
    />
  );
}

const TagExcerptComponent = registerComponent(
  "TagExcerpt",
  TagExcerpt,
);

declare global {
  interface ComponentTypes {
    TagExcerpt: typeof TagExcerptComponent,
  }
}
