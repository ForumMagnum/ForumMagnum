import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagBySlug } from './useTag';
import { linkStyle } from '../linkPreview/PostLinkPreview';

const styles = theme => ({
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
    marginLeft: -2,
    marginRight: 0
  }
});


const TagHoverPreview = ({href, targetLocation, innerHTML, classes}: {
  href: string,
  targetLocation: any,
  innerHTML: string,
  classes: ClassesType,
}) => {
  const { params: {slug} } = targetLocation;
  const { tag } = useTagBySlug(slug, "TagFragment");
  const { PopperCard, TagPreview, Loading } = Components;
  const { hover, anchorEl, eventHandlers } = useHover();
  const { showPostCount: showPostCountQuery } = targetLocation.query
  const showPostCount = tag && tag.postCount && showPostCountQuery === "true" // query parameters are stored as strings

  return <span {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl}>
      {tag
        ? <TagPreview tag={tag}/>
        : <Loading/>}
    </PopperCard>
    <Link className={showPostCount ? classes.linkWithoutDegreeSymbol : classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
    {showPostCount && <span className={classes.count}>({tag?.postCount})</span>}
  </span>;
}

const TagHoverPreviewComponent = registerComponent("TagHoverPreview", TagHoverPreview, {styles});

declare global {
  interface ComponentTypes {
    TagHoverPreview: typeof TagHoverPreviewComponent
  }
}
