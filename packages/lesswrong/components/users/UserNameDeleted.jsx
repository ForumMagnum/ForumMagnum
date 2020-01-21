import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';

const UserNameDeleted = () => {
  return <Components.LWTooltip title="This user has deactivated their account">
    [anonymous]
  </Components.LWTooltip>
};

registerComponent('UserNameDeleted', UserNameDeleted);
