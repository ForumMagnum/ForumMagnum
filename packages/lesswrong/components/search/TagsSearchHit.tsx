import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Tags from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';

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
    color: 'rgba(0,0,0,0.5)'
  }
})

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const TagsSearchHit = ({hit, clickAction, classes}: {
  hit: any,
  clickAction?: any,
  classes: ClassesType,
}) => {

return <div className={classes.root}>
    <Link to={Tags.getUrl(hit)} onClick={(event) => isLeftClick(event) && clickAction && clickAction()}>
      <div className={classes.name}>
        {hit.name}
      </div>
      <div className={classes.snippet}>
        <Snippet attribute="description" hit={hit} tagName="mark" />
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

