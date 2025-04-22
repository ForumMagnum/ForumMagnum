// @inheritedComponent Modal

import React from 'react';
import ReactDOM from 'react-dom';
import warning from 'warning';
import debounce from 'debounce'; // < 1kb payload overhead when lodash/debounce is > 3kb.
import EventListener from 'react-event-listener';
import ownerDocument from '../utils/ownerDocument';
import ownerWindow from '../utils/ownerWindow';
import Modal from '../Modal';
import Grow from '../Grow';
import Paper from '../Paper';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';
import { StandardProps } from '..';
import { ModalProps } from '../Modal/Modal';
import { TransitionHandlerProps, TransitionProps } from '../transitions/transition';
import { PaperProps } from '../Paper/Paper';

export interface PopoverOrigin {
  horizontal: 'left' | 'center' | 'right' | number;
  vertical: 'top' | 'center' | 'bottom' | number;
}

export interface PopoverPosition {
  top: number;
  left: number;
}

export type PopoverReference = 'anchorEl' | 'anchorPosition' | 'none';

export interface PopoverProps
  extends StandardProps<ModalProps & Partial<TransitionHandlerProps>, PopoverClassKey, 'children'> {
  action?: (actions: PopoverActions) => void;
  anchorEl?: null | HTMLElement | ((element: HTMLElement) => HTMLElement);
  anchorOrigin?: PopoverOrigin;
  anchorPosition?: PopoverPosition;
  anchorReference?: PopoverReference;
  elevation?: number;
  getContentAnchorEl?: null | ((element: HTMLElement) => HTMLElement);
  marginThreshold?: number;
  modal?: boolean;
  ModalClasses?: ModalProps['classes'];
  PaperProps?: Partial<PaperProps>;
  role?: string;
  transformOrigin?: PopoverOrigin;
  TransitionComponent?: React.ComponentType;
  transitionDuration?: TransitionProps['timeout'] | 'auto';
  TransitionProps?: TransitionProps;
  children?: React.ReactNode;
}

export type PopoverClassKey = 'paper';

export interface PopoverActions {
  updatePosition(): void;
}

function getOffsetTop(rect, vertical) {
  let offset = 0;

  if (typeof vertical === 'number') {
    offset = vertical;
  } else if (vertical === 'center') {
    offset = rect.height / 2;
  } else if (vertical === 'bottom') {
    offset = rect.height;
  }

  return offset;
}

function getOffsetLeft(rect, horizontal) {
  let offset = 0;

  if (typeof horizontal === 'number') {
    offset = horizontal;
  } else if (horizontal === 'center') {
    offset = rect.width / 2;
  } else if (horizontal === 'right') {
    offset = rect.width;
  }

  return offset;
}

function getTransformOriginValue(transformOrigin) {
  return [transformOrigin.horizontal, transformOrigin.vertical]
    .map(n => {
      return typeof n === 'number' ? `${n}px` : n;
    })
    .join(' ');
}

// Sum the scrollTop between two elements.
function getScrollParent(parent, child) {
  let element = child;
  let scrollTop = 0;

  while (element && element !== parent) {
    element = element.parentNode;
    scrollTop += element.scrollTop;
  }
  return scrollTop;
}

function getAnchorEl(anchorEl) {
  return typeof anchorEl === 'function' ? anchorEl() : anchorEl;
}

export const styles = defineStyles("MuiPopover", theme => ({
  /* Styles applied to the `Paper` component. */
  paper: {
    position: 'absolute',
    overflowY: 'auto',
    overflowX: 'hidden',
    // So we see the popover when it's empty.
    // It's most likely on issue on userland.
    minWidth: 16,
    minHeight: 16,
    maxWidth: 'calc(100% - 32px)',
    maxHeight: 'calc(100% - 32px)',
    // We disable the focus ring for mouse, touch and keyboard users.
    outline: 'none',
  },
}), {stylePriority: -10});

class Popover extends React.Component<PopoverProps & WithStylesProps<typeof styles>> {
  handleGetOffsetTop = getOffsetTop;

  handleGetOffsetLeft = getOffsetLeft;

  handleResize = debounce(() => {
    this.setPositioningStyles(this.paperRef);
  }, 166); // Corresponds to 10 frames at 60 Hz.

  componentDidMount() {
    if (this.props.action) {
      this.props.action({
        updatePosition: this.handleResize,
      });
    }
  }

  componentWillUnmount = () => {
    this.handleResize.clear();
  };

  setPositioningStyles = element => {
    if (element && element.style) {
      const positioning = this.getPositioningStyle(element);
      if (positioning.top !== null) {
        element.style.top = positioning.top;
      }
      if (positioning.left !== null) {
        element.style.left = positioning.left;
      }
      element.style.transformOrigin = positioning.transformOrigin;
    }
  };

  getPositioningStyle = element => {
    const { anchorEl, anchorReference, marginThreshold } = this.props;

    // Check if the parent has requested anchoring on an inner content node
    const contentAnchorOffset = this.getContentAnchorOffset(element);
    const elemRect = {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };

    // Get the transform origin point on the element itself
    const transformOrigin = this.getTransformOrigin(elemRect, contentAnchorOffset);

    if (anchorReference === 'none') {
      return {
        top: null,
        left: null,
        transformOrigin: getTransformOriginValue(transformOrigin),
      };
    }

    // Get the offset of of the anchoring element
    const anchorOffset = this.getAnchorOffset(contentAnchorOffset);

    // Calculate element positioning
    let top = anchorOffset.top - transformOrigin.vertical;
    let left = anchorOffset.left - transformOrigin.horizontal;
    const bottom = top + elemRect.height;
    const right = left + elemRect.width;

    // Use the parent window of the anchorEl if provided
    const containerWindow = ownerWindow(getAnchorEl(anchorEl));

    // Window thresholds taking required margin into account
    const heightThreshold = containerWindow.innerHeight - marginThreshold;
    const widthThreshold = containerWindow.innerWidth - marginThreshold;

    // Check if the vertical axis needs shifting
    if (top < marginThreshold) {
      const diff = top - marginThreshold;
      top -= diff;
      transformOrigin.vertical += diff;
    } else if (bottom > heightThreshold) {
      const diff = bottom - heightThreshold;
      top -= diff;
      transformOrigin.vertical += diff;
    }

    warning(
      elemRect.height < heightThreshold || !elemRect.height || !heightThreshold,
      [
        'Material-UI: the popover component is too tall.',
        `Some part of it can not be seen on the screen (${elemRect.height - heightThreshold}px).`,
        'Please consider adding a `max-height` to improve the user-experience.',
      ].join('\n'),
    );

    // Check if the horizontal axis needs shifting
    if (left < marginThreshold) {
      const diff = left - marginThreshold;
      left -= diff;
      transformOrigin.horizontal += diff;
    } else if (right > widthThreshold) {
      const diff = right - widthThreshold;
      left -= diff;
      transformOrigin.horizontal += diff;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      transformOrigin: getTransformOriginValue(transformOrigin),
    };
  };

  // Returns the top/left offset of the position
  // to attach to on the anchor element (or body if none is provided)
  getAnchorOffset(contentAnchorOffset) {
    const { anchorEl, anchorOrigin, anchorReference, anchorPosition } = this.props;

    if (anchorReference === 'anchorPosition') {
      warning(
        anchorPosition,
        'Material-UI: you need to provide a `anchorPosition` property when using ' +
          '<Popover anchorReference="anchorPosition" />.',
      );
      return anchorPosition;
    }

    // If an anchor element wasn't provided, just use the parent body element of this Popover
    const anchorElement = getAnchorEl(anchorEl) || ownerDocument(this.paperRef).body;
    const anchorRect = anchorElement.getBoundingClientRect();
    const anchorVertical = contentAnchorOffset === 0 ? anchorOrigin.vertical : 'center';

    return {
      top: anchorRect.top + this.handleGetOffsetTop(anchorRect, anchorVertical),
      left: anchorRect.left + this.handleGetOffsetLeft(anchorRect, anchorOrigin.horizontal),
    };
  }

  // Returns the vertical offset of inner content to anchor the transform on if provided
  getContentAnchorOffset(element) {
    const { getContentAnchorEl, anchorReference } = this.props;
    let contentAnchorOffset = 0;

    if (getContentAnchorEl && anchorReference === 'anchorEl') {
      const contentAnchorEl = getContentAnchorEl(element);

      if (contentAnchorEl && element.contains(contentAnchorEl)) {
        const scrollTop = getScrollParent(element, contentAnchorEl);
        contentAnchorOffset =
          contentAnchorEl.offsetTop + contentAnchorEl.clientHeight / 2 - scrollTop || 0;
      }

      // != the default value
      warning(
        this.props.anchorOrigin.vertical === 'top',
        [
          'Material-UI: you can not change the default `anchorOrigin.vertical` value ',
          'when also providing the `getContentAnchorEl` property to the popover component.',
          'Only use one of the two properties.',
          'Set `getContentAnchorEl` to `null | undefined`' +
            ' or leave `anchorOrigin.vertical` unchanged.',
        ].join('\n'),
      );
    }

    return contentAnchorOffset;
  }

  // Return the base transform origin using the element
  // and taking the content anchor offset into account if in use
  getTransformOrigin(elemRect, contentAnchorOffset = 0) {
    const { transformOrigin } = this.props;
    return {
      vertical: this.handleGetOffsetTop(elemRect, transformOrigin.vertical) + contentAnchorOffset,
      horizontal: this.handleGetOffsetLeft(elemRect, transformOrigin.horizontal),
    };
  }

  handleEnter = element => {
    if (this.props.onEnter) {
      this.props.onEnter(element);
    }

    this.setPositioningStyles(element);
  };

  render() {
    const {
      action,
      anchorEl,
      anchorOrigin,
      anchorPosition,
      anchorReference,
      children,
      classes,
      container: containerProp,
      elevation,
      getContentAnchorEl,
      marginThreshold,
      ModalClasses,
      onEnter,
      onEntered,
      onEntering,
      onExit,
      onExited,
      onExiting,
      open,
      PaperProps,
      role,
      transformOrigin,
      TransitionComponent,
      transitionDuration: transitionDurationProp,
      TransitionProps,
      ...other
    } = this.props;

    let transitionDuration = transitionDurationProp;

    if (transitionDurationProp === 'auto' && !TransitionComponent.muiSupportAuto) {
      transitionDuration = undefined;
    }

    // If the container prop is provided, use that
    // If the anchorEl prop is provided, use its parent body element as the container
    // If neither are provided let the Modal take care of choosing the container
    const container =
      containerProp || (anchorEl ? ownerDocument(getAnchorEl(anchorEl)).body : undefined);

    return (
      <Modal
        classes={ModalClasses}
        container={container}
        open={open}
        BackdropProps={{ invisible: true }}
        {...other}
      >
        <TransitionComponent
          appear
          in={open}
          onEnter={this.handleEnter}
          onEntered={onEntered}
          onEntering={onEntering}
          onExit={onExit}
          onExited={onExited}
          onExiting={onExiting}
          role={role}
          timeout={transitionDuration}
          {...TransitionProps}
        >
          <Paper
            className={classes.paper}
            data-mui-test="Popover"
            elevation={elevation}
            ref={ref => {
              this.paperRef = ReactDOM.findDOMNode(ref);
            }}
            {...PaperProps}
          >
            <EventListener target="window" onResize={this.handleResize} />
            {children}
          </Paper>
        </TransitionComponent>
      </Modal>
    );
  }
}

Popover.defaultProps = {
  anchorReference: 'anchorEl',
  anchorOrigin: {
    vertical: 'top',
    horizontal: 'left',
  },
  elevation: 8,
  marginThreshold: 16,
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left',
  },
  TransitionComponent: Grow,
  transitionDuration: 'auto',
};

export default withStyles(styles, Popover);
