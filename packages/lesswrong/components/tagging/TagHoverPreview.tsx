import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagPreview } from './useTag';
import { linkStyle } from '../linkPreview/PostLinkPreview';
import { removeUrlParameters } from '../../lib/routeUtil';
import classNames from 'classnames';
import { hasWikiLenses } from '@/lib/betas';
import { RouterLocation } from "../../lib/vulcan-lib/routes";
import { defineStyles, useStyles } from '../hooks/useStyles';
import TagsTooltip from "./TagsTooltip";

const styles = defineStyles('TagHoverPreview', (theme: ThemeType) => ({
  ...linkStyle(theme),
  count: {
    color: theme.palette.secondary.main, // grey[500],
    fontSize: ".9em",
    position: "relative",
    marginLeft: 3,
    marginRight: 0
  }
}));

function normalizeTagLink(link: string) {
  return removeUrlParameters(link, ["showPostCount", "useTagName"]);
}

export const TagHoverPreview = ({
  href,
  targetLocation,
  postCount=6,
  noPrefetch,
  children,
}: {
  href: string,
  targetLocation: RouterLocation,
  postCount?: number,
  noPrefetch?: boolean,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  
  const { params: {slug}, hash } = targetLocation;
  // Slice the hash to remove the leading # (which won't be a part of the
  // element ID in the dom) eg: "Further_reading"
  const hashId = hash.slice(1);

  const {tag, loading} = useTagPreview(slug, hashId, noPrefetch);
  const { showPostCount: showPostCountQuery, useTagName: useTagNameQuery, } = targetLocation.query
  const lensQuery = targetLocation.query.lens ?? targetLocation.query.l;
  const showPostCount = showPostCountQuery === "true" // query parameters are strings
  const tagName = useTagNameQuery === "true" ? tag?.name : undefined // query parameters are strings
  const previewSlug = lensQuery ?? slug;
  // Remove showPostCount and useTagName query parameters from the link, if present
  const linkTarget = normalizeTagLink(href);

  const isRead = tag?.isRead;
  const isRedLink = hasWikiLenses && ((!tag && !noPrefetch && !loading) || tag?.isPlaceholderPage);
  return (
    <TagsTooltip
      tagSlug={previewSlug}
      hash={hashId}
      As="span"
      previewPostCount={postCount}
      noPrefetch={noPrefetch}
      isRedLink={isRedLink}
    >
      <Link
        className={classNames(
          !showPostCount && classes.link,
          isRead && "visited",
          isRedLink && classes.redLink,
        )}
        to={linkTarget}
      >
        {tagName ?? children}
      </Link>
      {!!(showPostCount && tag?.postCount) &&
        <span className={classes.count}>({tag?.postCount})</span>
      }
    </TagsTooltip>
  );
}
