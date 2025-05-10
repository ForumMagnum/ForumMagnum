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

const BetaTagInner = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  return <span className={classes.root}>[Beta]</span>
}

export const BetaTag = registerComponent('BetaTag', BetaTagInner, {styles});


