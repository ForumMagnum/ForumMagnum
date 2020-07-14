import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagBySlug } from './useTag';
import { linkStyle } from '../linkPreview/PostLinkPreview';

const styles = theme => ({
  link: {
    ...linkStyle(theme),
    '&:after': {}
  },
  count: {
    color: theme.palette.grey[500],
    fontSize: ".9em",
    position: "relative",
    marginLeft: 2,
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
  console.log({href})
  console.log({targetLocation})
  console.log({showPostCount: targetLocation.query.showPostCount})
  const { showPostCount } = targetLocation.query

  return <span {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl}>
      {tag
        ? <TagPreview tag={tag}/>
        : <Loading/>}
    </PopperCard>
    <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
    {tag && tag.postCount && <span className={classes.count}>({tag.postCount})</span>}
  </span>;
}

const TagHoverPreviewComponent = registerComponent("TagHoverPreview", TagHoverPreview, {styles});

declare global {
  interface ComponentTypes {
    TagHoverPreview: typeof TagHoverPreviewComponent
  }
}
