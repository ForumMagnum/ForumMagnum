import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagBySlug } from './useTag';

const styles = theme => ({
  card: {
    padding: 16,
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
  const { tag } = useTagBySlug(slug);
  const { PopperCard, TagPreview, Loading } = Components;
  const { hover, anchorEl, eventHandlers } = useHover();
  
  if (!tag)
    return <Loading/>
  
  return <span {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl}>
      <div className={classes.card}>
        <TagPreview tag={tag}/>
      </div>
    </PopperCard>
    <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  </span>;
}

const TagHoverPreviewComponent = registerComponent("TagHoverPreview", TagHoverPreview, {styles});

declare global {
  interface ComponentTypes {
    TagHoverPreview: typeof TagHoverPreviewComponent
  }
}
