import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    height: 150,
    "@media print": {
      height: 0,
    },
  }
});

const Footer = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root} />
  )
}

export default registerComponent('Footer', Footer, {styles});


