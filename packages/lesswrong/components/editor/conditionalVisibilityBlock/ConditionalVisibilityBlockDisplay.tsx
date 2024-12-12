import React, { createContext, useContext } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { ConditionalVisibilitySettings } from './conditionalVisibility';

export const RevealHiddenBlocksContext = createContext(false);

const ConditionalVisibilityBlockDisplay = ({options, children}: {
  options: ConditionalVisibilitySettings,
  children: React.ReactNode,
}) => {
  const revealHiddenBlocks = useContext(RevealHiddenBlocksContext);

  // TODO: When options.type is "knowsRequisite", "wantsRequisite", or "ifPathBeforeOrAfter", this is sometimes true.
  let visible = false;
  
  if (revealHiddenBlocks) {
    return <Components.ShowBlockVisibilityCondition options={options}>
      {children}
    </Components.ShowBlockVisibilityCondition>
  } else if (visible) {
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

