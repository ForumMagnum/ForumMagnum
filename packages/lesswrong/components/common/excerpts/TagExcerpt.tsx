import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import { CommonExcerptProps } from "./ContentExcerpt";

const TagExcerpt = ({
  tag,
  ...commonExcerptProps
}: CommonExcerptProps & {
  tag: TagRecentDiscussion,
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
      {...commonExcerptProps}
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
