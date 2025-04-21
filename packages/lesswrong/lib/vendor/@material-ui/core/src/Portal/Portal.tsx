import React from 'react';
import ReactDOM from 'react-dom';
import ownerDocument from '../utils/ownerDocument';

export interface PortalProps {
  children: React.ReactElement<any>;
  container?: React.ReactInstance | (() => React.ReactInstance) | null;
  disablePortal?: boolean;
  onRendered?: () => void;
}

function getContainer(container, defaultContainer) {
  container = typeof container === 'function' ? container() : container;
  return ReactDOM.findDOMNode(container) || defaultContainer;
}

function getOwnerDocument(element) {
  return ownerDocument(ReactDOM.findDOMNode(element));
}

/**
 * Portals provide a first-class way to render children into a DOM node
 * that exists outside the DOM hierarchy of the parent component.
 */
class Portal extends React.Component<PortalProps> {
  componentDidMount() {
    this.setMountNode(this.props.container);

    // Only rerender if needed
    if (!this.props.disablePortal) {
      this.forceUpdate(this.props.onRendered);
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.container !== this.props.container ||
      prevProps.disablePortal !== this.props.disablePortal
    ) {
      this.setMountNode(this.props.container);

      // Only rerender if needed
      if (!this.props.disablePortal) {
        this.forceUpdate(this.props.onRendered);
      }
    }
  }

  componentWillUnmount() {
    this.mountNode = null;
  }

  setMountNode(container) {
    if (this.props.disablePortal) {
      this.mountNode = ReactDOM.findDOMNode(this).parentElement;
      return;
    }

    this.mountNode = getContainer(container, getOwnerDocument(this).body);
  }

  /**
   * @public
   */
  getMountNode = () => {
    return this.mountNode;
  };

  render() {
    const { children, disablePortal } = this.props;

    if (disablePortal) {
      return children;
    }

    return this.mountNode ? ReactDOM.createPortal(children, this.mountNode) : null;
  }
}

Portal.defaultProps = {
  disablePortal: false,
};

export default Portal;
