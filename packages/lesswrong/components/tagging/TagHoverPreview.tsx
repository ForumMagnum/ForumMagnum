import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagBySlug } from './useTag';
import { linkStyle } from '../linkPreview/PostLinkPreview';

const styles = theme => ({
  link: {
    ...linkStyle(theme)
  },
  card: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
    width: 600,
  },
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
  
  return <span {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl}>
      <div className={classes.card}>
        {tag
          ? <TagPreview tag={tag}/>
          : <Loading/>}
      </div>
    </PopperCard>
    <Link className={classes.link} to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  </span>;
}

const TagHoverPreviewComponent = registerComponent("TagHoverPreview", TagHoverPreview, {styles});

declare global {
  interface ComponentTypes {
    TagHoverPreview: typeof TagHoverPreviewComponent
  }
}
