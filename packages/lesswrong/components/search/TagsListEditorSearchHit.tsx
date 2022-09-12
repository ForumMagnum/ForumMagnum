import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import type { Hit } from 'react-instantsearch-core';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer"
  }
});

const TagsListEditorSearchHit = ({hit, classes}: {
  hit: Hit<any>,
  classes: ClassesType,
}) => {
  const tag = (hit as AlgoliaTag);

  return (
    <div className={classes.root}>
      <Components.MetaInfo>
        {tag.name}
      </Components.MetaInfo>
      <Components.MetaInfo>
        {tag.postCount ?? 0} posts
      </Components.MetaInfo>
    </div>
  )
}


const TagsListEditorSearchHitComponent = registerComponent("TagsListEditorSearchHit", TagsListEditorSearchHit, {styles});

declare global {
  interface ComponentTypes {
    TagsListEditorSearchHit: typeof TagsListEditorSearchHitComponent
  }
}

