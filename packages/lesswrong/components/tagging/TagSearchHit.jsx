import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = {
  root: {
    padding: 8,
  },
};

const TagSearchHit = ({hit, onClick, classes}) => {
  return (
    <div className={classes.root} onClick={onClick} >
      {hit.name}
    </div>
  );
}

registerComponent("TagSearchHit", TagSearchHit,
  withStyles(styles, {name: "TagSearchHit"}));
