import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { ConditionalVisibilitySettings } from './conditionalVisibility';

const ConditionalVisibilityBlockDisplay = ({options, children}: {
  options: ConditionalVisibilitySettings,
  children: React.ReactNode,
}) => {
  // TODO: When options.type is "knowsRequisite", "wantsRequisite", or "ifPathBeforeOrAfter", this is sometimes true.
  let visible = false;
  
  if (visible) {
    return <div>{children}</div>
  } else {
    return null;
  }
}

const ConditionalVisibilityBlockDisplayComponent = registerComponent('ConditionalVisibilityBlockDisplay', ConditionalVisibilityBlockDisplay);

declare global {
  interface ComponentTypes {
    ConditionalVisibilityBlockDisplay: typeof ConditionalVisibilityBlockDisplayComponent
  }
}

