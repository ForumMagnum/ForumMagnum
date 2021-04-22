import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagBySlug } from './useTag';
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

const TagHoverPreview = ({href, targetLocation, innerHTML, classes, postCount=6}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  classes: ClassesType,
  postCount?: number
}) => {
  const { params: {slug} } = targetLocation;
  const { tag } = useTagBySlug(slug, "TagPreviewFragment");
  const { PopperCard, TagPreview, Loading } = Components;
  const { hover, anchorEl, eventHandlers } = useHover();
  const { showPostCount: showPostCountQuery, useTagName: useTagNameQuery } = targetLocation.query
  const showPostCount = showPostCountQuery === "true" // query parameters are strings
  const useTagName = tag && tag.name && useTagNameQuery === "true" // query parameters are strings
  
  // Remove showPostCount and useTagName query parameters from the link, if present
  const linkTarget = normalizeTagLink(href);

  return <span {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl}>
      {tag
        ? <TagPreview tag={tag} postCount={postCount}/>
        : <Loading/>}
    </PopperCard>
    <Link
      className={showPostCount ? classes.linkWithoutDegreeSymbol : classes.link}
      to={linkTarget}
      dangerouslySetInnerHTML={{__html: useTagName ? tag?.name : innerHTML}}
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
