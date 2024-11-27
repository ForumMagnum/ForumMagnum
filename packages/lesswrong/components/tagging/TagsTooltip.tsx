import React, { FC, ReactNode, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useTagPreview } from "./useTag";
import { isFriendlyUI } from "../../themes/forumTheme";
import { Link } from '../../lib/reactRouterWrapper';
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
  skip?: boolean,
) => {
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
  loading: {
    paddingLeft: 16,
    paddingRight: 32,
    paddingBottom: 24,
  },
  redLinkTooltip: {
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 16,
    ...(!isFriendlyUI && {
      width: 500,
      paddingBottom: 6,
    }),
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    }
  },
  redLinkTooltipTitle: {
    fontSize: '13px',
    marginBottom: 4,
    color: theme.palette.text.secondary,
  },
});

const RedLinkTooltip = ({ classes, ...tagsTooltipProps }: TagsTooltipTag & { classes: ClassesType<typeof styles> }) => {
  const { Typography, ContentStyles, TagHoverPreview } = Components;
  const derivedTitle = tagsTooltipProps.tagSlug!.split('_').map((word, idx) => {
    if (idx === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');

  return <div className={classes.redLinkTooltip}>
    <Typography variant='title'>
      {derivedTitle}
    </Typography>
    {/* TODO: this is a hardcoded example; when we implement the backend for red links we should fix this */}
    <ContentStyles contentType='tag'>
      This red link was used on one 1 other page:
      <ul>
        <li>
          <TagHoverPreview targetLocation={{ params: { slug: 'nash_equilibrium' }, hash: '', query: {} } as AnyBecauseTodo} href='/tag/nash_equilibrium' noPrefetch>
            <Link to={`/tag/nash_equilibrium`}>
              Nash Equilibrium
            </Link>
          </TagHoverPreview>
        </li>
      </ul>
    </ContentStyles>
    <ContentStyles contentType='tag' className={classes.redLinkTooltipTitle}>
      A red link highlights author's intention to point at a concept that doesn't have a satisfactory explanation written (by their standards).
    </ContentStyles>
  </div>
}

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
  isRedLink,
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
  isRedLink?: boolean,
  children: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const [everHovered, setEverHovered] = useState(false);
  const { tag, loading } = useTagsTooltipTag(
    tagsTooltipProps, hash,
    (noPrefetch && !everHovered) || isRedLink
  );

  const { HoverOver, Loading, TagRelCard, TagPreview } = Components;
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
          {isRedLink && <RedLinkTooltip classes={classes} {...tagsTooltipProps} />}
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
  {styles},
);

declare global {
  interface ComponentTypes {
    TagsTooltip: typeof TagsTooltipComponent
  }
}
