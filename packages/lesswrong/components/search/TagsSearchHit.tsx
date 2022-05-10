import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';
import type { Hit } from 'react-instantsearch-core';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginLeft: theme.spacing.unit,
    marginTop: 6,
    marginBottom: theme.spacing.unit/2
  },
  name: {
    ...theme.typography.body2,
  },
  snippet: {
    ...theme.typography.body2,
    color: theme.palette.text.dim,
  }
})

const isLeftClick = (event: MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const TagsSearchHit = ({hit, clickAction, classes}: {
  hit: Hit<any>,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const tag = hit as AlgoliaTag;
  return <div className={classes.root}>
    <Link to={tagGetUrl(tag)} onClick={(event: MouseEvent) => isLeftClick(event) && clickAction && clickAction()}>
      <div className={classes.name}>
        {tag.name}
      </div>
      <div className={classes.snippet}>
        <Snippet attribute="description" hit={tag} tagName="mark" />
      </div>
    </Link>
  </div>
}

const TagsSearchHitComponent = registerComponent("TagsSearchHit", TagsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    TagsSearchHit: typeof TagsSearchHitComponent
  }
}

