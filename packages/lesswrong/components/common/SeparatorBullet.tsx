import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';

const SeparatorBullet = ({classes}) => {
  return <>" • "</>;
}

const SeparatorBulletComponent = registerComponent("SeparatorBullet", SeparatorBullet);

declare global {
  interface ComponentTypes {
    SeparatorBullet: typeof SeparatorBulletComponent
  }
}
