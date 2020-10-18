import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const UserNameDeleted = () => {
  return <Components.LWTooltip title={<div>
    <div>Author has deactivated their account,</div>
    <div>or is no longer associated with this post.</div>
  </div>}>
    [anonymous]
  </Components.LWTooltip>
};

const UserNameDeletedComponent = registerComponent('UserNameDeleted', UserNameDeleted);

declare global {
  interface ComponentTypes {
    UserNameDeleted: typeof UserNameDeletedComponent
  }
}
