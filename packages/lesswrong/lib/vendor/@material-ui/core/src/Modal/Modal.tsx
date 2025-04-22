import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import warning from 'warning';
import keycode from 'keycode';
import ownerDocument from '../utils/ownerDocument';
import RootRef from '../RootRef';
import Portal from '../Portal';
import { createChainedFunction } from '../utils/helpers';
import ModalManager from './ModalManager';
import Backdrop from '../Backdrop';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';
import { StandardProps } from '..';
import { BackdropProps } from '../Backdrop/Backdrop';
import { PortalProps } from '../Portal/Portal';

export interface ModalProps
  extends StandardProps<React.HtmlHTMLAttributes<HTMLDivElement>, ModalClassKey> {
  BackdropComponent?: React.ReactType<BackdropProps>;
  BackdropProps?: Partial<BackdropProps>;
  container?: PortalProps['container'];
  disableAutoFocus?: boolean;
  disableBackdropClick?: boolean;
  disableEnforceFocus?: boolean;
  disableEscapeKeyDown?: boolean;
  disablePortal?: PortalProps['disablePortal'];
  disableRestoreFocus?: boolean;
  hideBackdrop?: boolean;
  keepMounted?: boolean;
  manager?: ModalManager;
  onBackdropClick?: React.ReactEventHandler<{}>;
  onClose?: React.ReactEventHandler<{}>;
  onEscapeKeyDown?: React.ReactEventHandler<{}>;
  onRendered?: PortalProps['onRendered'];
  open: boolean;
}

export type ModalClassKey = 'root' | 'hidden';

function getContainer(container, defaultContainer) {
  container = typeof container === 'function' ? container() : container;
  return ReactDOM.findDOMNode(container) || defaultContainer;
}

function getHasTransition(props) {
  return props.children ? props.children.props.hasOwnProperty('in') : false;
}

export const styles = defineStyles("MuiModal", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'fixed',
    zIndex: theme.zIndexes.modal,
    right: 0,
    bottom: 0,
    top: 0,
    left: 0,
  },
  /* Styles applied to the root element if the `Modal` has exited. */
  hidden: {
    visibility: 'hidden',
  },
}), {stylePriority: -10});

/**
 * This component shares many concepts with [react-overlays](https://react-bootstrap.github.io/react-overlays/#modals).
 */
class Modal extends React.Component<ModalProps> {
  mounted = false;

  constructor(props) {
    super();
    this.state = {
      exited: !props.open,
    };
  }

  componentDidMount() {
    this.mounted = true;
    if (this.props.open) {
      this.handleOpen();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.checkForFocus();
    }

    if (prevProps.open && !this.props.open && !getHasTransition(this.props)) {
      // Otherwise handleExited will call this.
      this.handleClose();
    } else if (!prevProps.open && this.props.open) {
      this.handleOpen();
    }
  }

  componentWillUnmount() {
    this.mounted = false;

    if (this.props.open || (getHasTransition(this.props) && !this.state.exited)) {
      this.handleClose();
    }
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.open) {
      return {
        exited: false,
      };
    }

    if (!getHasTransition(nextProps)) {
      // Otherwise let handleExited take care of marking exited.
      return {
        exited: true,
      };
    }

    return null;
  }

  handleRendered = () => {
    this.autoFocus();

    // Fix a bug on Chrome where the scroll isn't initially 0.
    this.modalRef.scrollTop = 0;

    if (this.props.onRendered) {
      this.props.onRendered();
    }
  };

  handleOpen = () => {
    const doc = ownerDocument(this.mountNode);
    const container = getContainer(this.props.container, doc.body);

    this.props.manager.add(this, container);
    doc.addEventListener('keydown', this.handleDocumentKeyDown);
    doc.addEventListener('focus', this.enforceFocus, true);
  };

  handleClose = () => {
    this.props.manager.remove(this);
    const doc = ownerDocument(this.mountNode);
    doc.removeEventListener('keydown', this.handleDocumentKeyDown);
    doc.removeEventListener('focus', this.enforceFocus, true);
    this.restoreLastFocus();
  };

  handleExited = () => {
    this.setState({ exited: true });
    this.handleClose();
  };

  handleBackdropClick = event => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (this.props.onBackdropClick) {
      this.props.onBackdropClick(event);
    }

    if (!this.props.disableBackdropClick && this.props.onClose) {
      this.props.onClose(event, 'backdropClick');
    }
  };

  handleDocumentKeyDown = event => {
    if (!this.isTopModal() || keycode(event) !== 'esc') {
      return;
    }

    // Ignore events that have been `event.preventDefault()` marked.
    if (event.defaultPrevented) {
      return;
    }

    if (this.props.onEscapeKeyDown) {
      this.props.onEscapeKeyDown(event);
    }

    if (!this.props.disableEscapeKeyDown && this.props.onClose) {
      this.props.onClose(event, 'escapeKeyDown');
    }
  };

  checkForFocus = () => {
    this.lastFocus = ownerDocument(this.mountNode).activeElement;
  };

  enforceFocus = () => {
    if (this.props.disableEnforceFocus || !this.mounted || !this.isTopModal()) {
      return;
    }

    const currentActiveElement = ownerDocument(this.mountNode).activeElement;

    if (this.dialogRef && !this.dialogRef.contains(currentActiveElement)) {
      this.dialogRef.focus();
    }
  };

  autoFocus() {
    if (this.props.disableAutoFocus) {
      return;
    }

    const currentActiveElement = ownerDocument(this.mountNode).activeElement;

    if (this.dialogRef && !this.dialogRef.contains(currentActiveElement)) {
      this.lastFocus = currentActiveElement;

      if (!this.dialogRef.hasAttribute('tabIndex')) {
        warning(
          false,
          [
            'Material-UI: the modal content node does not accept focus.',
            'For the benefit of assistive technologies, ' +
              'the tabIndex of the node is being set to "-1".',
          ].join('\n'),
        );
        this.dialogRef.setAttribute('tabIndex', -1);
      }

      this.dialogRef.focus();
    }
  }

  restoreLastFocus() {
    if (this.props.disableRestoreFocus) {
      return;
    }

    if (this.lastFocus) {
      // Not all elements in IE11 have a focus method.
      // Because IE11 market share is low, we accept the restore focus being broken
      // and we silent the issue.
      if (this.lastFocus.focus) {
        this.lastFocus.focus();
      }

      this.lastFocus = null;
    }
  }

  isTopModal() {
    return this.props.manager.isTopModal(this);
  }

  render() {
    const {
      BackdropComponent,
      BackdropProps,
      children,
      classes,
      className,
      container,
      disableAutoFocus,
      disableBackdropClick,
      disableEnforceFocus,
      disableEscapeKeyDown,
      disablePortal,
      disableRestoreFocus,
      hideBackdrop,
      keepMounted,
      manager,
      onBackdropClick,
      onClose,
      onEscapeKeyDown,
      onRendered,
      open,
      ...other
    } = this.props;
    const { exited } = this.state;
    const hasTransition = getHasTransition(this.props);
    const childProps = {};

    if (!keepMounted && !open && (!hasTransition || exited)) {
      return null;
    }

    // It's a Transition like component
    if (hasTransition) {
      childProps.onExited = createChainedFunction(this.handleExited, children.props.onExited);
    }

    if (children.props.role === undefined) {
      childProps.role = children.props.role || 'document';
    }

    if (children.props.tabIndex === undefined) {
      childProps.tabIndex = children.props.tabIndex || '-1';
    }

    return (
      <Portal
        ref={ref => {
          this.mountNode = ref ? ref.getMountNode() : ref;
        }}
        container={container}
        disablePortal={disablePortal}
        onRendered={this.handleRendered}
      >
        <div
          data-mui-test="Modal"
          ref={ref => {
            this.modalRef = ref;
          }}
          className={classNames(classes.root, className, {
            [classes.hidden]: exited,
          })}
          {...other}
        >
          {hideBackdrop ? null : (
            <BackdropComponent open={open} onClick={this.handleBackdropClick} {...BackdropProps} />
          )}
          <RootRef
            rootRef={ref => {
              this.dialogRef = ref;
            }}
          >
            {React.cloneElement(children, childProps)}
          </RootRef>
        </div>
      </Portal>
    );
  }
}

Modal.defaultProps = {
  disableAutoFocus: false,
  disableBackdropClick: false,
  disableEnforceFocus: false,
  disableEscapeKeyDown: false,
  disablePortal: false,
  disableRestoreFocus: false,
  hideBackdrop: false,
  keepMounted: false,
  // Modals don't open on the server so this won't conflict with concurrent requests.
  manager: new ModalManager(),
  BackdropComponent: Backdrop,
};

export default withStyles(styles, Modal);
