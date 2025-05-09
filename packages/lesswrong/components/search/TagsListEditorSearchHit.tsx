import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { Hit } from 'react-instantsearch-core';
import { MetaInfo } from "../common/MetaInfo";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer"
  }
});

const TagsListEditorSearchHitInner = ({hit, classes}: {
  hit: Hit<any>,
  classes: ClassesType<typeof styles>,
}) => {
  const tag = (hit as SearchTag);

  return (
    <div className={classes.root}>
      <MetaInfo>
        {tag.name}
      </MetaInfo>
      <MetaInfo>
        {tag.postCount ?? 0} posts
      </MetaInfo>
    </div>
  )
}


export const TagsListEditorSearchHit = registerComponent("TagsListEditorSearchHit", TagsListEditorSearchHitInner, {styles});



