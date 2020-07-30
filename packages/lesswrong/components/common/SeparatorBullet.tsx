import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginLeft: 3,
    marginRight: 3
  }
})
const SeparatorBullet = ({classes}: {
  classes: ClassesType,
}) => {
  return <span className={classes.root}>{" "}•{" "}</span>;
}

const SeparatorBulletComponent = registerComponent("SeparatorBullet", SeparatorBullet, {styles});

declare global {
  interface ComponentTypes {
    SeparatorBullet: typeof SeparatorBulletComponent
  }
}
