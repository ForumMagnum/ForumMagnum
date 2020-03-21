import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const SeparatorBullet = () => {
  return <>{" "}•{" "}</>;
}

const SeparatorBulletComponent = registerComponent("SeparatorBullet", SeparatorBullet);

declare global {
  interface ComponentTypes {
    SeparatorBullet: typeof SeparatorBulletComponent
  }
}
