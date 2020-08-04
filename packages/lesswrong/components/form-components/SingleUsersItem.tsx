import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Chip from '@material-ui/core/Chip';

const styles = {
  chip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: "rgba(0,0,0,0.05)"
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
};

const SingleUsersItem = ({document, removeItem, classes }: {
  document: UsersProfile,
  removeItem: (id: string)=>void,
  classes: ClassesType
}) => {
  if (document) {
    return <Chip
        onDelete={() => removeItem(document._id)}
        className={classes.chip}
        label={document.displayName}
      />
  } else {
    return <Components.Loading />
  }
};

const SingleUsersItemComponent = registerComponent('SingleUsersItem', SingleUsersItem, {styles});

declare global {
  interface ComponentTypes {
    SingleUsersItem: typeof SingleUsersItemComponent
  }
}
