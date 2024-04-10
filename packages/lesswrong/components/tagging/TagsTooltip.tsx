import React, { FC, ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useTagPreview } from "./useTag";
import { isFriendlyUI } from "../../themes/forumTheme";
import classNames from "classnames";

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

export type TagsTooltipPreviewWrapper = FC<{
  tag: PreviewableTag | null,
  loading: boolean,
  children: ReactNode,
}>;

const DefaultPreviewWrapper: TagsTooltipPreviewWrapper = ({children}) => (
  <>{children}</>
);

const styles = (theme: ThemeType) => ({
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
});

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
  classes,
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
  classes: ClassesType<typeof styles>,
}) => {
  const {tag, loading} = useTagsTooltipTag(tagsTooltipProps, hash, noPrefetch);

  const Title = useCallback<FC>(() => {
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
        <TagPreview
          tag={tag}
          hash={hash}
          postCount={previewPostCount}
          hideRelatedTags={hideRelatedTags}
        />
      );
    }

    return null;
  }, [loading, tagRel, tag, hash, previewPostCount, hideRelatedTags]);

  const {HoverOver} = Components;
  return (
    <HoverOver
      title={
        <PreviewWrapper tag={tag} loading={loading}>
          <Title />
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
  {styles},
);

declare global {
  interface ComponentTypes {
    TagsTooltip: typeof TagsTooltipComponent
  }
}
