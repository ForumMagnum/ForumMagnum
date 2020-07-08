import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';

const styles = theme => ({
  tag: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 6,
    ...theme.typography.smallText,

  },
  count: {
    color: theme.palette.grey[500],
    fontSize: ".9em",
    position: "relative",
    marginLeft: 4,
    marginRight: 8
  }
});

const TagsListItem = ({tag, classes}: {
  tag: TagPreviewFragment,
  classes: ClassesType,
}) => {
  const { PopperCard, TagPreview } = Components;
  const { hover, anchorEl, eventHandlers } = useHover();

  return <div {...eventHandlers} className={classes.tag}>
    <PopperCard 
      open={hover} 
      anchorEl={anchorEl} 
      placement="right-start"
    >
      <TagPreview tag={tag}/>
    </PopperCard>
    <Link to={`/tag/${tag.slug}`}>
      {tag.name} { tag.needsReview } { tag.reviewedByUserId }
    </Link>
    {tag.postCount && <span className={classes.count}>({tag.postCount})</span>} 
  </div>;
}

const TagsListItemComponent = registerComponent("TagsListItem", TagsListItem, {styles});

declare global {
  interface ComponentTypes {
    TagsListItem: typeof TagsListItemComponent
  }
}
