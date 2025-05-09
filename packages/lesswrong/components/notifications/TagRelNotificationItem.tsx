import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Loading } from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  meta: {
    fontSize: ".9rem",
    color: theme.palette.text.dim45,
  },
  title: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  }
});

export const TagRelNotificationItemInner = ({classes, tagRelId}: {
  classes: ClassesType<typeof styles>,
  tagRelId: string
}) => {
  const { document: tagRel, loading } = useSingle({
    documentId: tagRelId,
    collectionName: "TagRels",
    fragmentName: 'TagRelFragment',
  });

  if (loading) return <Loading/>
  if (!tagRel) {return null;}

  return <div>
    <div className={classes.meta}>New post tagged <em>{tagRel.tag?.name}</em>:</div>
    <div className={classes.title}>{tagRel.post?.title}</div>
  </div>;
}

export const TagRelNotificationItem = registerComponent('TagRelNotificationItem', TagRelNotificationItemInner, {styles});



