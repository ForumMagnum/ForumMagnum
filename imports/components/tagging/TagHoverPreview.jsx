import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withHover from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper.js';
import { useTagBySlug } from './useTag.jsx';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  card: {
    padding: 16,
    width: 600,
  },
});

const TagHoverPreview = ({href, targetLocation, innerHTML, classes, hover, anchorEl}) => {
  const { params: {slug} } = targetLocation;
  const { tag } = useTagBySlug(slug);
  const { PopperCard, TagPreview } = Components;
  
  return <span>
    <PopperCard open={hover} anchorEl={anchorEl}>
      <div className={classes.card}>
        <TagPreview tag={tag}/>
      </div>
    </PopperCard>
    <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  </span>;
}

registerComponent("TagHoverPreview", TagHoverPreview, withHover,
  withStyles(styles, {name: "TagHoverPreview"}));
