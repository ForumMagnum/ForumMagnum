import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    paddingLeft: 4,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: ".9rem",
    color: theme.palette.grey[600],
  }
});

const BetaTag = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  return <span className={classes.root}>[Beta]</span>
}

const BetaTagComponent = registerComponent('BetaTag', BetaTag, {styles});

declare global {
  interface ComponentTypes {
    BetaTag: typeof BetaTagComponent
  }
}

export default BetaTagComponent;
