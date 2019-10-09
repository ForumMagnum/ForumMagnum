import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';

const SeparatorBullet = ({classes}) => {
  return " • ";
}

registerComponent("SeparatorBullet", SeparatorBullet);
