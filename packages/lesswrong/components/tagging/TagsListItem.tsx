import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  card: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
    width: 600,
  },
  tag: {
    display: "inline-block",
    width: 250,
    paddingTop: 1,
    paddingBottom: 1
  },
  count: {
    color: theme.palette.grey[600],
    fontSize: "1rem",
    position: "relative",
  }
});

const TagsListItem = ({tag, classes}: {
  tag: TagPreviewFragment,
  classes: ClassesType,
}) => {
  const { PopperCard, TagPreview } = Components;
  const { hover, anchorEl, eventHandlers } = useHover();
  
  return <span {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl} placement="right-start">
      <div className={classes.card}>
        <TagPreview tag={tag}/>
      </div>
    </PopperCard>
    <Typography key={tag._id} variant="body2" className={classes.tag}>
      <Link to={`/tag/${tag.slug}`}>
        {tag.name} {tag.postCount && <span className={classes.count}>({tag.postCount})</span>}
      </Link>
    </Typography>
  </span>;
}

const TagsListItemComponent = registerComponent("TagsListItem", TagsListItem, {styles});

declare global {
  interface ComponentTypes {
    TagsListItem: typeof TagsListItemComponent
  }
}
