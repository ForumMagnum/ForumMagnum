import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { tagStyle } from '../tagging/FooterTag';
import classNames from 'classnames';
import ForumIcon from "@/components/common/ForumIcon";
import { Loading } from "@/components/vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
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

const SingleTagItem = ({documentId, onDelete, className, classes}: {
  documentId: string,
  onDelete: (id: string) => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Tags",
    fragmentName: 'TagBasicInfo',
  })

  if (loading) {
    return <Loading />
  }

  if (document) {
    return <div className={classNames(classes.tag, className)}>
      {document.name}
      <button className={classes.removeTag} onClick={() => onDelete(document._id)}>
        <ForumIcon icon="Close" />
      </button>
    </div>
  }

  return null
};

const SingleTagItemComponent = registerComponent(
  'SingleTagItem',
  SingleTagItem,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    SingleTagItem: typeof SingleTagItemComponent
  }
}

export default SingleTagItemComponent;
