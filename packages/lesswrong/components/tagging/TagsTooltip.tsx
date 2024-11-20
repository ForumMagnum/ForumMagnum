import React, { FC, ReactNode, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useTagPreview } from "./useTag";
import { isFriendlyUI } from "../../themes/forumTheme";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";

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
  skip?: boolean,
): {
  tag: PreviewableTag | null,
  loading: boolean,
} => {
  const {tag: loadedTag, loading} = useTagPreview(tagSlug ?? "", hash, {
    skip: skip || !!tag,
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

export type TagsTooltipPreviewWrapper = FC<{
  tag: PreviewableTag | null,
  loading: boolean,
  children: ReactNode,
}>;

const DefaultPreviewWrapper: TagsTooltipPreviewWrapper = ({children}) => (
  <>{children}</>
);

const styles = defineStyles("TagsTooltip", (theme: ThemeType) => ({
  tooltip: isFriendlyUI
    ? {}
    : {
      padding: "4px 0 0 0",
      background: theme.palette.panelBackground.default,
      boxShadow: theme.palette.boxShadow.lwTagHoverOver,
    },
  tooltipTitle: isFriendlyUI
    ? {}
    : {
      maxWidth: "unset",
    },
  loading: {
    paddingLeft: 16,
    paddingRight: 32,
    paddingBottom: 24,
  },
}));

const TagsTooltip = ({
  tagRel,
  hash,
  previewPostCount = 6,
  hideRelatedTags,
  noPrefetch,
  PreviewWrapper = DefaultPreviewWrapper,
  As,
  inlineBlock = false,
  className,
  popperClassName,
  children,
  ...tagsTooltipProps
}: TagsTooltipTag & {
  tagRel?: TagRelMinimumFragment
  hash?: string,
  previewPostCount?: number,
  hideRelatedTags?: boolean,
  noPrefetch?: boolean,
  PreviewWrapper?: TagsTooltipPreviewWrapper,
  As?: keyof JSX.IntrinsicElements,
  inlineBlock?: boolean,
  className?: string,
  popperClassName?: string,
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  const [everHovered, setEverHovered] = useState(false);
  const {tag, loading} = useTagsTooltipTag(
    tagsTooltipProps, hash,
    noPrefetch && !everHovered
  );

  const {HoverOver, Loading, TagRelCard, TagPreview} = Components;
  return (
    <HoverOver
      title={
        <PreviewWrapper tag={tag} loading={loading}>
          {loading && <Loading className={classes.loading}/>}
          {!loading && tagRel && <TagRelCard tagRel={tagRel}/>}
          {!loading && !tagRel && tag && <TagPreview
            tag={tag}
            hash={hash}
            postCount={previewPostCount}
            hideRelatedTags={hideRelatedTags}
          />}
        </PreviewWrapper>
      }
      clickable
      As={As}
      inlineBlock={inlineBlock}
      analyticsProps={{
        pageElementContext: "tagItem",
        tagId: tag?._id,
        tagName: tag?.name,
        tagSlug: tag?.slug
      }}
      onShow={useCallback(() => setEverHovered(true), [])}
      className={className}
      popperClassName={classNames(classes.tooltip, popperClassName)}
      titleClassName={classes.tooltipTitle}
    >
      {children}
    </HoverOver>
  );
}

const TagsTooltipComponent = registerComponent(
  "TagsTooltip",
  TagsTooltip,
);

export default TagsTooltipComponent;

declare global {
  interface ComponentTypes {
    TagsTooltip: typeof TagsTooltipComponent
  }
}
