import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { Hit } from 'react-instantsearch-core';

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer"
  }
});

const TagsListEditorSearchHit = ({hit, classes}: {
  hit: Hit<any>,
  classes: ClassesType<typeof styles>,
}) => {
  const tag = (hit as SearchTag);

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

