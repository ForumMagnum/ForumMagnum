import React, { ChangeEvent } from 'react';
import ClickAwayListener, { ClickAwayEvent } from '../../lib/vendor/react-click-away-listener';
import { registerComponent } from '../../lib/vulcan-lib/components';

/**
 * Wrapped to ensure that "onClick" is the default mouse event.
 * Without it, this would be a "onMouseUp" event, which happens BEFORE "onClick",
 * and resulted in some annoying behavior. Also MUI v5 defaults this to "onClick".
 */
const LWClickAwayListenerInner = ({onClickAway, children}: {
  onClickAway: (ev: ClickAwayEvent) => void,
  children: React.ReactNode,
}) => {
  return (
    <ClickAwayListener
      onClickAway={ev => {
        onClickAway(ev);
      }}
    >
      <span>
        {children}
      </span>
    </ClickAwayListener>
  );
}

export const LWClickAwayListener = registerComponent('LWClickAwayListener', LWClickAwayListenerInner);

declare global {
  interface ComponentTypes {
    LWClickAwayListener: typeof LWClickAwayListener
  }
}
