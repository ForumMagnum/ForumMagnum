import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = {
  root: {
    display: "block",
    padding: 8,
    cursor: "pointer",
  },
};

const TagSearchHit = ({hit, onClick, classes}) => {
  return (
    <a className={classes.root} onClick={onClick} >
      {hit.name}
    </a>
  );
}

registerComponent("TagSearchHit", TagSearchHit,
  withStyles(styles, {name: "TagSearchHit"}));
