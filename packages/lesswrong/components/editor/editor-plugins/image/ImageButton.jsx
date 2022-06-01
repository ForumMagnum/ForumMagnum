import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AddLinkForm from './AddImageForm';

export default class ImageButton extends Component {
  static propTypes = {
    placeholder: PropTypes.string,
    store: PropTypes.object,
    ownTheme: PropTypes.object,
    modifier: PropTypes.func,
  };

  onMouseDown = (event) => {
    event.preventDefault();
  }

  onAddLinkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { onOverrideContent, modifier, theme } = this.props;
    const content = (props) =>
      <AddLinkForm {...props} theme={theme} modifier={modifier} />;
    onOverrideContent(content);
  }

  hasEntity = (editorState, entityType) => {
    const entity = this.getCurrentEntity(editorState);
    return entity && entity.getType() === entityType;
  }

  render() {
    const { theme } = this.props;

    return (
      <div
        className={theme.buttonWrapper}
        onMouseDown={this.onMouseDown}
      >
        <button
          className={theme.button}
          onClick={this.onAddLinkClick}
          type="button"
        >
          <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </button>
      </div>
    );
  }
}
