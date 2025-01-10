import { registerComponent } from '../../lib/vulcan-lib';
import React, {MutableRefObject, ReactNode, useState} from 'react';
import type { PopperPlacementType } from '@material-ui/core/Popper'
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { createPortal } from 'react-dom';
import type { State } from '@popperjs/core/lib/types';

const SECOND_TOOLTIP_SELECTOR = '#lw-popper-tooltip';

const styles = (theme: ThemeType) => ({
  popper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper
  },
  default: {
    position: "relative",
    zIndex: theme.zIndexes.lwPopperTooltip,
  },
  tooltip: {
    backgroundColor: theme.palette.panelBackground.tooltipBackground,
    borderRadius: 3,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontSize: "1rem",
    padding: theme.spacing.unit,
    color: theme.palette.text.tooltipText,
    position: "relative",
    zIndex: theme.zIndexes.lwPopperTooltip,
  },
  noMouseEvents: {
    pointerEvents: "none",
  },
  hideOnTouchScreens: {
    "@media (pointer:coarse)": {
      display: "none",
    },
  },
})

// This is a wrapper around the Popper library so we can easily replace it with different versions and
// implementations
const LWPopper = ({
  classes,
  children,
  className,
  tooltip=false,
  allowOverflow,
  overflowPadding,
  flip,
  open,
  anchorEl,
  placement,
  fallbackPlacements,
  checkForSecondTooltip = false,
  clickable = true,
  hideOnTouchScreens,
  updateRef
}: {
  classes: ClassesType<typeof styles>,
  children: ReactNode,
  tooltip?: boolean,
  allowOverflow?: boolean,
  overflowPadding?: number,
  flip?: boolean,
  open: boolean,
  placement?: PopperPlacementType,
  fallbackPlacements?: PopperPlacementType[],
  checkForSecondTooltip?: boolean,
  anchorEl: any,
  className?: string,
  clickable?: boolean,
  hideOnTouchScreens?: boolean,
  updateRef?: MutableRefObject<(() => Promise<Partial<State>>) | null | undefined>
}) => {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);

  const flipModifier = flip !== false ? [
    {
      name: 'flip',
      enabled: true,
      options: {
        fallbackPlacements: fallbackPlacements,
      },
    },
  ] : [
    {
      name: 'flip',
      enabled: false,
    }
  ];

  const preventOverflowModifier = [
    {
      name: 'preventOverflow',
      enabled: !allowOverflow,
      options: {padding: overflowPadding},
    }
  ];

  // Custom modifier to check for a second tooltip
  const secondTooltipModifier = checkForSecondTooltip ? [
    {
      name: 'checkSecondTooltip',
      enabled: true,
      phase: 'main',
      fn({ state }: { state: State }) {
        // Logic to check for a second tooltip below the anchor element
        const secondTooltipExists = document.querySelector(SECOND_TOOLTIP_SELECTOR); // Replace with actual selector
        if (secondTooltipExists) {
          // Adjust placement to 'left-end' if a second tooltip is detected
          state.placement = 'left-end';
        }
      },
    }
  ] : [];

  const { styles, attributes, update } = usePopper(anchorEl, popperElement, {
    placement,
    modifiers: [
      {
        name: 'computeStyles',
        options: {
          gpuAcceleration: false,
        },
      },
      ...flipModifier,
      ...preventOverflowModifier,
      ...secondTooltipModifier,
    ],
  });

  if (updateRef && update) {
    updateRef.current = update
  }

  if (!open) return null;

  // In some cases, interacting with something inside a popper will cause a rerender that detaches the anchorEl
  // This happened in hovers on in-line reacts, and the button to create a new react ended up on the top-left corner of the page
  if (anchorEl && !anchorEl.isConnected) {
    return null;
  }

  // We use createPortal here to avoid having to deal with overflow problems and styling from the current child
  // context, by placing the Popper element directly into the document root
  // Rest of usage from https://popper.js.org/react-popper/v2/
  return (
    <>
      {createPortal(
        <div
          id={SECOND_TOOLTIP_SELECTOR}
          ref={setPopperElement}
          className={classNames(
            {
              [classes.tooltip]: tooltip,
              [classes.default]: !tooltip,
              [classes.noMouseEvents]: !clickable,
              [classes.hideOnTouchScreens]: hideOnTouchScreens,
            },
            className
          )}
          style={styles.popper}
          {...attributes.popper}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
};

const LWPopperComponent = registerComponent('LWPopper', LWPopper, {styles});

declare global {
  interface ComponentTypes {
    LWPopper: typeof LWPopperComponent
  }
}
