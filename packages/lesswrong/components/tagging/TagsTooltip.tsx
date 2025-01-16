import React, { FC, ReactNode, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useTagPreview } from "./useTag";
import { isFriendlyUI } from "../../themes/forumTheme";
import { Link } from '../../lib/reactRouterWrapper';
import classNames from "classnames";
import { PopperPlacementType } from "@material-ui/core/Popper";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { inferRedLinkTitle, useRedLinkPingbacks } from "./RedlinkTagPage";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { useTagPageContext } from "./TagPageContext";
import { commentBodyStyles } from "@/themes/stylePiping";


const styles = defineStyles("TagsTooltip", theme => ({
  tooltip: isFriendlyUI
    ? {}
    : {
      padding: 0,
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
  noTagOrPlaceholderMessage: {
    paddingTop: 0,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
    '& .ContentStyles-base.ContentStyles-tagBody': {
      marginBottom: '0 !important',
    }
  },
  redLinkTooltip: {
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 16,
    width: 500,
    paddingBottom: 6,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
    '& .ContentStyles-base.ContentStyles-tagBody': {
      marginBottom: '0 !important',
    }
  },
  redLinkTooltipTitle: {
    marginTop: 8,
    fontSize: '13px',
    marginBottom: 4,
    color: theme.palette.text.secondary,
  },
}));

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


const RedLinkTooltip = ({ tag, slug }: {
  tag: TagBasicInfo | null
  slug?: string
}) => {
  const classes = useStyles(styles);
  const { Typography, ContentStyles, TagHoverPreview, Loading } = Components;
  const { tag: currentlyViewingTag } = useTagPageContext() ?? {};
  const excludedPingbackTagIds = currentlyViewingTag?._id ? [currentlyViewingTag._id] : undefined;
  const { results: pingbacks, loading: loadingPingbacks } = useRedLinkPingbacks(tag?._id, excludedPingbackTagIds);
  const title = inferRedLinkTitle(tag, slug ?? null);

  if (!tag) {
    return (
      <div className={classes.noTagOrPlaceholderMessage}>
        <ContentStyles contentType='tag'>
          No page or placeholder found for this link.
        </ContentStyles>
      </div>
    );
  }

  let pingbacksSection;

  if (loadingPingbacks) {
    // Display loading indicator while pingbacks are loading
    pingbacksSection = <Loading />;
  } else if (pingbacks && pingbacks.length > 0) {
    // Handle singular and plural forms for pingbacks count
    const pingbackCount = pingbacks.length;
    const pageWord = pingbackCount === 1 ? 'page' : 'pages';

    pingbacksSection = (
      <div>
        This red link was used on {pingbackCount} other {pageWord}:
        <ul>
          {pingbacks.map(pingback => (
            <li key={pingback._id}>
              <TagHoverPreview
                targetLocation={{ params: { slug: pingback.slug }, hash: '', query: {} } as AnyBecauseTodo}
                href={tagGetUrl({ slug: pingback.slug })}
                noPrefetch
              >
                <Link to={tagGetUrl({ slug: pingback.slug })}>
                  {pingback.name}
                </Link>
              </TagHoverPreview>
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    // Display message when there are no pingbacks
    pingbacksSection = (
      <div>
        A placeholder (red link) was created for this concept.
      </div>
    );
  }

  return (
    <div className={classes.redLinkTooltip}>
      <Typography variant='title'>
        {title}
      </Typography>
      <ContentStyles contentType='tag'>
        {pingbacksSection}
        <div className={classes.redLinkTooltipTitle}>
          A red link is a placeholder for a wikitag page that an authors thinks should exist.
        </div>
      </ContentStyles>
    </div>
  );
};

const TagsTooltip = ({
  tagRel,
  hash,
  previewPostCount = 6,
  hideDescription = false,
  hideRelatedTags,
  noPrefetch,
  PreviewWrapper = DefaultPreviewWrapper,
  As,
  inlineBlock = false,
  placement,
  className,
  popperClassName,
  isRedLink,
  children,
  ...tagsTooltipProps
}: TagsTooltipTag & {
  tagRel?: TagRelMinimumFragment
  hash?: string,
  previewPostCount?: number,
  hideRelatedTags?: boolean,
  hideDescription?: boolean,
  noPrefetch?: boolean,
  PreviewWrapper?: TagsTooltipPreviewWrapper,
  As?: keyof JSX.IntrinsicElements,
  inlineBlock?: boolean,
  placement?: PopperPlacementType,
  className?: string,
  popperClassName?: string,
  isRedLink?: boolean,
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  const [everHovered, setEverHovered] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const { tag, loading } = useTagsTooltipTag(
    tagsTooltipProps, hash,
    (noPrefetch && !everHovered)
  );

  const { HoverOver, Loading, TagRelCard, TagPreview, LWClickAwayListener } = Components;
  return (
    <HoverOver
      title={
        <LWClickAwayListener onClickAway={() => setForceOpen(false)}>
          <PreviewWrapper tag={tag} loading={loading}>
            {loading && <Loading className={classes.loading}/>}
            {!loading && tagRel && <TagRelCard tagRel={tagRel}/>}
            {!loading && !tagRel && tag && !isRedLink && <TagPreview
              tag={tag}
              hash={hash}
              postCount={previewPostCount}
              hideRelatedTags={hideRelatedTags}
              hideDescription={hideDescription}
              setForceOpen={setForceOpen}
            />}
            {isRedLink && <RedLinkTooltip tag={tag} slug={tagsTooltipProps.tagSlug} />}
          </PreviewWrapper>
        </LWClickAwayListener>
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
      placement={placement}
      forceOpen={forceOpen}
    >
      {children}
    </HoverOver>
  );
}

const TagsTooltipComponent = registerComponent("TagsTooltip", TagsTooltip);

declare global {
  interface ComponentTypes {
    TagsTooltip: typeof TagsTooltipComponent
  }
}
