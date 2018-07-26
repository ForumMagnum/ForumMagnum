import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Chip from '@material-ui/core/Chip';
import { withStyles } from '@material-ui/core/styles';

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

const SingleUsersItem = ({document, removeItem, classes }) => {
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
registerComponent('SingleUsersItem', SingleUsersItem, withStyles(styles));
