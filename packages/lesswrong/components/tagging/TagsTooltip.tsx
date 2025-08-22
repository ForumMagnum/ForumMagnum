import React, { FC, ReactNode, useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useTagPreview } from "./useTag";
import { Link } from '../../lib/reactRouterWrapper';
import classNames from "classnames";
import type { Placement as PopperPlacementType } from "popper.js"
import { defineStyles, useStyles } from "../hooks/useStyles";
import { inferRedLinkTitle, useRedLinkPingbacks } from "./RedlinkTagPage";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { useTagPageContext } from "./TagPageContext";
import { MAIN_TAB_ID } from "@/lib/arbital/useTagLenses";
import { TagHoverPreview } from "./TagHoverPreview";
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import ContentStyles from "../common/ContentStyles";
import HoverOver from "../common/HoverOver";
import TagRelCard from "./TagRelCard";
import TagPreview from "./TagPreview";
import LWClickAwayListener from "../common/LWClickAwayListener";

const styles = defineStyles("TagsTooltip", theme => ({
  tooltip: theme.isFriendlyUI
    ? {}
    : {
      padding: 0,
      background: theme.palette.panelBackground.default,
      boxShadow: theme.palette.boxShadow.lwTagHoverOver,
    },
  tooltipTitle: theme.isFriendlyUI
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
  const {tag: loadedTag, loading} = useTagPreview(tagSlug ?? "", hash, skip || !!tag);

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

const RedLinksPingbacks = ({tag}: {tag: TagBasicInfo}) => {
  const { selectedLens } = useTagPageContext() ?? {};

  // We don't want to show pingbacks from the lens that the redlink is in
  // If we're on the main tab, the "lens" is synthetic and derived from the tag itself, but the _id is hardcoded to be the "MAIN_TAB_ID" const
  // In that case, we take the parentDocumentId, which is the tag's actual id.
  let excludedPingbackTagIds: string[] | undefined;
  if (selectedLens) {
    const tagId = selectedLens._id === MAIN_TAB_ID
      ? selectedLens.parentDocumentId
      : selectedLens._id;
      
    excludedPingbackTagIds = [tagId];
  }

  const { results: pingbacks, loading, totalCount } = useRedLinkPingbacks(tag?._id, excludedPingbackTagIds);

  if (loading) {
    return <Loading />;
  } 

  if (pingbacks && pingbacks.length === 0) {
    // note that this message gets viewed by the user in combination with the longer redlink description in `RedLinkTooltip`
    return <div>The linked page does not exist; it is a red link.</div>;
  }

  return <div>
    This red link was used on {totalCount} other {totalCount === 1 ? 'page' : 'pages'}:
    <ul>
      {pingbacks.slice(0, 5).map(pingback => (
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
    {pingbacks.length > 5 && <div>And {pingbacks.length - 5} more...</div>}
  </div>
}


const RedLinkTooltip = ({ tag, slug }: {
  tag: TagBasicInfo | null
  slug?: string
}) => {
  const classes = useStyles(styles);
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

  return (
    <div className={classes.redLinkTooltip}>
      <Typography variant='title'>
        {title}
      </Typography>
      <ContentStyles contentType='tag'>
        <RedLinksPingbacks tag={tag} />
        <div className={classes.redLinkTooltipTitle}>
          A red link is a placeholder for a wikitag page that an author thinks should exist.
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
  As?: 'span' | 'div',
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

export default registerComponent("TagsTooltip", TagsTooltip);


