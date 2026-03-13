import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { Hit } from 'react-instantsearch-core';
import MetaInfo from "../common/MetaInfo";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TagsListEditorSearchHit", (theme: ThemeType) => ({
  root: {
    cursor: "pointer"
  }
}));

const TagsListEditorSearchHit = ({hit}: {
  hit: Hit<any>,
}) => {
  const classes = useStyles(styles);
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


export default registerComponent("TagsListEditorSearchHit", TagsListEditorSearchHit, {styles});



