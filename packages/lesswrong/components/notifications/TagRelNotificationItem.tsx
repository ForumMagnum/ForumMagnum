import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { TagRels } from '../../lib/collections/tagRels/collection';

const styles = (theme: ThemeType): JssStyles => ({
  meta: {
    fontSize: ".9rem",
    color: "rgba(0,0,0,.45)"
  },
  title: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  }
});

export const TagRelNotificationItem = ({classes, tagRelId}: {
  classes: ClassesType,
  tagRelId: string
}) => {
  const { Loading } = Components

  const { document: tagRel, loading } = useSingle({
    documentId: tagRelId,
    collection: TagRels,
    fragmentName: 'TagRelFragment',
  });

  if (loading) return <Loading/>

  return <div className={classes.root}>
    <div className={classes.meta}>New post tagged <em>{tagRel.tag.name}</em>:</div>
    <div className={classes.title}>{tagRel.post.title}</div>
  </div>;
}

const TagRelNotificationItemComponent = registerComponent('TagRelNotificationItem', TagRelNotificationItem, {styles});

declare global {
  interface ComponentTypes {
    TagRelNotificationItem: typeof TagRelNotificationItemComponent
  }
}

