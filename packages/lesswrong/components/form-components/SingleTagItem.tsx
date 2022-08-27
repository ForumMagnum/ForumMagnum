import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import Chip from '@material-ui/core/Chip';

const styles = (theme: ThemeType): JssStyles => ({
  chip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: theme.palette.background.usersListItem,
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
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

  if (document && !loading) {
    return <Chip
        onDelete={() => onDelete(document._id)}
        className={classes.chip}
        label={document.name}
      />
  } else {
    return <Components.Loading />
  }
};

const SingleTagItemComponent = registerComponent('SingleTagItem', SingleTagItem, {styles});

declare global {
  interface ComponentTypes {
    SingleTagItem: typeof SingleTagItemComponent
  }
}
