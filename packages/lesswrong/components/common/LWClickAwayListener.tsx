import React, { ChangeEvent } from 'react';
import ClickAwayListener, { ClickAwayEvent } from '../../lib/vendor/react-click-away-listener';
import { registerComponent } from '../../lib/vulcan-lib/components';

/**
 * Wrapped to ensure that "onClick" is the default mouse event.
 * Without it, this would be a "onMouseUp" event, which happens BEFORE "onClick",
 * and resulted in some annoying behavior. Also MUI v5 defaults this to "onClick".
 */
const LWClickAwayListener = ({onClickAway, doOnDown=false, children}: {
  onClickAway: (ev: ClickAwayEvent) => void,
  
  /**
   * If set, triggers on mousedown/touchstart rather than click/touchend. Use
   * this if the clickaway closes something that was opened on-down, so that
   * releasing the mouse button from doesn't close the popup that pressing the
   * mouse button opened.
   */
  doOnDown?: boolean,

  children: React.ReactElement,
}) => {
  return (
    <ClickAwayListener
      onClickAway={ev => {
        onClickAway(ev);
      }}
      {...(doOnDown && {
        mouseEvent: "mousedown",
        touchEvent: "touchstart",
      })}
    >
      <span>
        {children}
      </span>
    </ClickAwayListener>
  );
}

const LWClickAwayListenerComponent = registerComponent('LWClickAwayListener', LWClickAwayListener);

declare global {
  interface ComponentTypes {
    LWClickAwayListener: typeof LWClickAwayListenerComponent
  }
}
