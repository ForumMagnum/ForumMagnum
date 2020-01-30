import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';

const styles = (theme) => ({
  root: {
    paddingLeft: 4,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: ".9rem",
    color: theme.palette.grey[600],
  }
});

const BetaTag = ({classes}) => {
  return <span className={classes.root}>[Beta]</span>
}

const BetaTagComponent = registerComponent('BetaTag', BetaTag, {styles});

declare global {
  interface ComponentTypes {
    BetaTag: typeof BetaTagComponent
  }
}
