import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: 10,
    marginRight: 10,
    color: theme.palette.primary.main
  }
})
const SeparatorBulletInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return <span className={classes.root}>{" "}•{" "}</span>;
}

export const SeparatorBullet = registerComponent("SeparatorBullet", SeparatorBulletInner, {styles});


