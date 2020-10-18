import { registerComponent } from '../../../lib/vulcan-core';
import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';

const BootstrapModal = ({ children, size = 'lg', show = false, onHide, title, showCloseButton = true, header, footer, ...rest }: any) => {

  let headerComponent;
  if (header) {
    headerComponent = <Modal.Header>{header}</Modal.Header>;
  } else if (title) {
    headerComponent = <Modal.Header closeButton={showCloseButton}><Modal.Title>{title}</Modal.Title></Modal.Header>;
  } else {
    headerComponent = <Modal.Header closeButton={showCloseButton}></Modal.Header>;
  }

  const footerComponent = footer ? <Modal.Footer>{footer}</Modal.Footer> : null;
  
  return (
    <Modal size={size} show={show} onHide={onHide} {...rest}>
      {headerComponent}
      <Modal.Body>
        {children}
      </Modal.Body>
      {footerComponent}
    </Modal>
  );
};

BootstrapModal.propTypes = {
  size: PropTypes.string,
  show: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  onHide: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  header: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  footer: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

const ModalComponent = registerComponent('Modal', BootstrapModal);

declare global {
  interface ComponentTypes {
    Modal: typeof ModalComponent
  }
}

