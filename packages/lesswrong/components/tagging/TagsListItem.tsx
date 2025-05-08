import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetUrl } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType) => ({
  tag: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    paddingTop: 3,
    paddingLeft: 6,
    paddingRight: 12,
    fontSize: "1.1rem",
    lineHeight: "1.1em",
    marginBottom: 8,
    breakInside: 'avoid-column',
  },
  count: {
    color: theme.palette.grey[500],
    fontSize: ".9em",
    position: "relative",
    marginLeft: 4,
    marginRight: 8
  },
  hideOnMobile: {
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  }
});

const TagsListItemInner = ({tag, classes, postCount=3}: {
  tag: TagPreviewFragment,
  classes: ClassesType<typeof styles>,
  postCount?: number,
}) => {
  const { PopperCard, TagPreview } = Components;
  const { hover, anchorEl, eventHandlers } = useHover();

  return <div {...eventHandlers} className={classes.tag}>
    <PopperCard 
      open={hover} 
      anchorEl={anchorEl} 
      placement="right-start"
    >
      <div className={classes.hideOnMobile}><TagPreview tag={tag} postCount={postCount}/></div>
    </PopperCard>
    <Link to={tagGetUrl(tag)}>
      {tag.name} { tag.needsReview }
    </Link>
    <span className={classes.count}>
      {tag.wikiOnly ? "(wiki)" : `(${tag.postCount||0})`}
    </span>
  </div>;
}

export const TagsListItem = registerComponent("TagsListItem", TagsListItemInner, {styles});

declare global {
  interface ComponentTypes {
    TagsListItem: typeof TagsListItem
  }
}
