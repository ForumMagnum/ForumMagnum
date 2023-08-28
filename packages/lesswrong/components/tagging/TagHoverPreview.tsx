import React from 'react';
import { Components, registerComponent, RouterLocation } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagPreview } from './useTag';
import { linkStyle } from '../linkPreview/PostLinkPreview';
import { removeUrlParameters } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  link: {
    ...linkStyle(theme),
  },
  linkWithoutDegreeSymbol: {
    ...linkStyle(theme),
    '&:after': {}
  },
  count: {
    color: theme.palette.secondary.main, // grey[500],
    fontSize: ".9em",
    position: "relative",
    marginLeft: 3,
    marginRight: 0
  }
});

function normalizeTagLink(link: string) {
  return removeUrlParameters(link, ["showPostCount", "useTagName"]);
}

const TagHoverPreview = ({href, targetLocation, innerHTML, classes, postCount=6, noPrefetch}: {
  href: string,
  targetLocation: RouterLocation,
  innerHTML: string,
  classes: ClassesType,
  postCount?: number,
  noPrefetch?: boolean,
}) => {
  const { params: {slug}, hash } = targetLocation;
  const { hover, anchorEl, eventHandlers, everHovered } = useHover();
  // Slice the hash to remove the leading # (which won't be a part of the element ID in the dom)
  // eg: "Further_reading"
  const hashId = hash.slice(1);
  const { tag, loading } = useTagPreview(slug, hashId, {skip: noPrefetch && !everHovered})
  const { PopperCard, TagPreview } = Components;
  const { showPostCount: showPostCountQuery, useTagName: useTagNameQuery } = targetLocation.query
  const showPostCount = showPostCountQuery === "true" // query parameters are strings
  const tagName = useTagNameQuery === "true" ? tag?.name : undefined // query parameters are strings
  
  // Remove showPostCount and useTagName query parameters from the link, if present
  const linkTarget = normalizeTagLink(href);

  return <span {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl}>
      <TagPreview tag={tag} postCount={postCount} loading={loading} hash={hashId}/>
    </PopperCard>
    <Link
      className={showPostCount ? classes.linkWithoutDegreeSymbol : classes.link}
      to={linkTarget}
      dangerouslySetInnerHTML={{__html: tagName ?? innerHTML}}
    />
    {!!(showPostCount && tag?.postCount) && <span className={classes.count}>({tag?.postCount})</span>}
  </span>;
}

const TagHoverPreviewComponent = registerComponent("TagHoverPreview", TagHoverPreview, {styles});

declare global {
  interface ComponentTypes {
    TagHoverPreview: typeof TagHoverPreviewComponent
  }
}
