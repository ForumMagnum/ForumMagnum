import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: 10,
    marginRight: 10,
    color: theme.palette.primary.main
  }
})
const SeparatorBullet = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return <span className={classes.root}>{" "}•{" "}</span>;
}

const SeparatorBulletComponent = registerComponent("SeparatorBullet", SeparatorBullet, {styles});

declare global {
  interface ComponentTypes {
    SeparatorBullet: typeof SeparatorBulletComponent
  }
}

export default SeparatorBulletComponent;
