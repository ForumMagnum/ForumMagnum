import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Tags from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginLeft: theme.spacing.unit,
    marginTop: theme.spacing.unit/2,
    marginBottom: theme.spacing.unit/2
  },
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
      <Components.MetaInfo>
        {hit.name}
      </Components.MetaInfo>
      <div><Snippet attribute="description" hit={hit} tagName="mark" /></div>
    </Link>
  </div>
}

const TagsSearchHitComponent = registerComponent("TagsSearchHit", TagsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    TagsSearchHit: typeof TagsSearchHitComponent
  }
}

