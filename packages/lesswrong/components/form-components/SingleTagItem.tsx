import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { tagStyle } from '../tagging/FooterTag';

const styles = (theme: ThemeType): JssStyles => ({
  tag: {
    display: 'inline-flex',
    alignItems: 'baseline',
    columnGap: 4,
    ...tagStyle(theme),
    cursor: 'default'
  },
  removeTag: {
    background: 'transparent',
    color: 'inherit',
    position: 'relative',
    minWidth: 15,
    '&:hover': {
      opacity: 0.5
    },
    '& svg': {
      position: 'absolute',
      top: -10,
      left: 2,
      width: 13,
      height: 13,
    },
  },
});

const SingleTagItem = ({documentId, onDelete, classes}: {
  documentId: string,
  onDelete: (id:string)=>void,
  classes: ClassesType
}) => {
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Tags",
    fragmentName: 'TagBasicInfo',
  })

  if (loading) {
    return <Components.Loading />
  }

  if (document) {
    return <div className={classes.tag}>
      {document.name}
      <button className={classes.removeTag} onClick={() => onDelete(document._id)}>
        <Components.ForumIcon icon="Close" />
      </button>
    </div>
  }

  return null
};

const SingleTagItemComponent = registerComponent('SingleTagItem', SingleTagItem, {styles});

declare global {
  interface ComponentTypes {
    SingleTagItem: typeof SingleTagItemComponent
  }
}
