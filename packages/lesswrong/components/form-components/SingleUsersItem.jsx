import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Chip from 'material-ui/Chip';

const styles = {
  chip: {
    margin: 4,
    backgroundColor: "rgba(0,0,0,0.05)"
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
};

const deleteIconStyle = {
  fill: "rgba(0,0,0,0.1)",
  color: "rgba(0,0,0,0.1)"
}

const SingleUsersItem = ({document, removeItem, clickAction }) => {
  if (document) {
    return <span className="users-item-body">
      <Chip
        onRequestDelete={() => removeItem(document._id)}
        deleteIconStyle={deleteIconStyle}
        style={styles.chip}
      >
        <span className="single-users-item-name">{document.displayName}</span>
      </Chip>
    </span>
  } else {
    return <Components.Loading />
  }
};
registerComponent('SingleUsersItem', SingleUsersItem);
