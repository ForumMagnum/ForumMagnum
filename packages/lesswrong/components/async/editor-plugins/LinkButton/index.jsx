// Copied from: https://raw.githubusercontent.com/draft-js-plugins/draft-js-plugins/master/draft-js-anchor-plugin/src/components/LinkButton/index.js

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import unionClassNames from 'union-class-names';
import EditorUtils from 'draft-js-plugins-utils';
import AddLinkForm from './AddLinkForm';

export default class LinkButton extends Component {
  static propTypes = {
    placeholder: PropTypes.string,
    getEditorState: PropTypes.func.isRequired,
    setEditorState: PropTypes.func.isRequired,
  };

  onMouseDown = (event) => {
    event.preventDefault();
  }

  onRemoveLinkAtSelection = () => this.props.setEditorState(
    EditorUtils.removeLinkAtSelection(this.props.getEditorState())
  )

  onAddLinkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { placeholder, onOverrideContent } = this.props;
    const content = (props) =>
      <AddLinkForm {...props} placeholder={placeholder} />;
    onOverrideContent(content);
  }

  render() {
    const { theme } = this.props;
    const hasLinkSelected = EditorUtils.hasEntity(
      this.props.getEditorState(),
      'LINK'
    );
    const className = hasLinkSelected
      ? unionClassNames(theme.button, theme.active)
      : theme.button;

    return (
      <div
        className={theme.buttonWrapper}
        onMouseDown={this.onMouseDown}
      >
        <button
          className={className}
          onClick={hasLinkSelected ? this.onRemoveLinkAtSelection : this.onAddLinkClick}
          type="button"
        >
          <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
        </button>
      </div>
    );
  }
}
