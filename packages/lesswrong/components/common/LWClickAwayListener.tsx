import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
// eslint-disable-next-line no-restricted-imports
import ClickAwayListener, { ClickAwayListenerProps } from '@material-ui/core/ClickAwayListener';

/**
 * Wrapped to ensure that "onClick" is the default mouse event.
 * Without it, this would be a "onMouseUp" event, which happens BEFORE "onClick",
 * and resulted in some annoying behavior. Also MUI v5 defaults this to "onClick".
 */
const LWClickAwayListener = ({children, ...props}: {
  children: React.ReactNode,
} & ClickAwayListenerProps) => {
  return (
    <ClickAwayListener mouseEvent="onClick" {...props}>
      {children}
    </ClickAwayListener>
  );
}

const LWClickAwayListenerComponent = registerComponent('LWClickAwayListener', LWClickAwayListener);

declare global {
  interface ComponentTypes {
    LWClickAwayListener: typeof LWClickAwayListenerComponent
  }
}
