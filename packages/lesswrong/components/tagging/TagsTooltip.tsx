import React, { FC, ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import { useTagPreview } from "./useTag";

type PreviewableTag =
  TagPreviewFragment |
  TagSectionPreviewFragment |
  TagRecentDiscussion;

type TagsTooltipTag = {
  tag: PreviewableTag,
  tagSlug?: never,
} | {
  tag?: never,
  tagSlug: string,
}

const useTagsTooltipTag = (
  {tag, tagSlug}: TagsTooltipTag,
  hash?: string,
  noPrefetch?: boolean,
): {
  tag: PreviewableTag | null,
  loading: boolean,
} => {
  const {tag: loadedTag, loading} = useTagPreview(tagSlug ?? "", hash, {
    skip: noPrefetch || !!tag,
  });

  if (tag) {
    return {
      tag,
      loading: false,
    };
  }

  return {
    tag: loadedTag,
    loading,
  };
}

const TagsTooltip = ({
  tagRel,
  hash,
  previewPostCount=6,
  noPrefetch,
  popperCard,
  As,
  inlineBlock=false,
  children,
  ...tagsTooltipProps
}: TagsTooltipTag & {
  tagRel?: TagRelMinimumFragment
  hash?: string,
  previewPostCount?: number,
  noPrefetch?: boolean,
  popperCard?: ReactNode,
  As?: keyof JSX.IntrinsicElements,
  inlineBlock?: boolean,
  children: ReactNode,
}) => {
  const {tag, loading} = useTagsTooltipTag(tagsTooltipProps, hash, noPrefetch);

  const Title = useCallback<FC>(() => {
    if (popperCard) {
      return (
        <>{popperCard}</>
      );
    }

    const {Loading, TagRelCard, TagPreview} = Components;
    if (loading) {
      return (
        <Loading />
      );
    }

    if (tagRel) {
      return (
        <TagRelCard tagRel={tagRel} />
      );
    }

    if (tag) {
      return (
        <TagPreview tag={tag} hash={hash} postCount={previewPostCount} />
      );
    }

    return null;
  }, [popperCard, loading, tagRel, tag, hash, previewPostCount]);

  const {LWTooltip, EAHoverOver} = Components;
  const Tooltip = isEAForum ? EAHoverOver : LWTooltip;
  return (
    <Tooltip
      title={<Title />}
      clickable
      As={As}
      inlineBlock={inlineBlock}
      analyticsProps={{
        pageElementContext: "tagItem",
        tagId: tag?._id,
        tagName: tag?.name,
        tagSlug: tag?.slug
      }}
    >
      {children}
    </Tooltip>
  );
}

const TagsTooltipComponent = registerComponent(
  "TagsTooltip",
  TagsTooltip,
);

declare global {
  interface ComponentTypes {
    TagsTooltip: typeof TagsTooltipComponent
  }
}
