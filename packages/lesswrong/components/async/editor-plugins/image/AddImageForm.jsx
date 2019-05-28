import React, { Component } from 'react';
import PropTypes from 'prop-types';
import unionClassNames from 'union-class-names';
import { EditorState, AtomicBlockUtils } from 'draft-js';
import prependHttp from 'prepend-http';
import urlRegex from './urlRegex';

export default class AddImageForm extends Component {
  static propTypes = {
    getEditorState: PropTypes.func.isRequired,
    setEditorState: PropTypes.func.isRequired,
    onOverrideContent: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
  };

  static defaultProps = {
    placeholder: 'Enter a URL and press enter'
  };

  state = {
    value: '',
    isInvalid: false
  };

  componentDidMount() {
    this.input.focus();
  }

  onRef = (node) => { this.input = node; }

  onChange = ({ target: { value } }) => {
    const nextState = { value };
    if (this.state.isInvalid && this.isUrl(this.normalizeUrl(value))) {
      nextState.isInvalid = false;
    }
    this.setState(nextState);
  };

  onClose = () =>
    this.props.onOverrideContent(undefined);

  onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.onClose();
    }
  }

  addImage = (editorState, url, extraData) => {
    const urlType = 'IMAGE';
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(urlType, 'IMMUTABLE', { ...extraData, src: url });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = AtomicBlockUtils.insertAtomicBlock(
      editorState,
      entityKey,
      ' '
    );
    return EditorState.forceSelection(
      newEditorState,
      editorState.getCurrentContent().getSelectionAfter()
    );
  };

  isUrl = (text) => {
  return urlRegex().test(text);
  }

  normalizeUrl = (url) => {
    return prependHttp(url);
  }

  submit() {
    const { getEditorState, setEditorState } = this.props;
    let { value: url } = this.state;
    url = this.normalizeUrl(url);
    if (!this.isUrl(url)) {
      this.setState({ isInvalid: true });
    } else {
      setEditorState(this.addImage(getEditorState(), url));
      this.input.blur();
      this.onClose();
    }
  }

  render() {
    const {
      placeholder
    } = this.props;
    const { value, isInvalid } = this.state;
    const className = isInvalid
      ? unionClassNames("image-form-input", "image-form-invalid")
      : "image-form-input";

    return (
      <input
        className={className}
        onBlur={this.onClose}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
        placeholder={placeholder}
        ref={this.onRef}
        type="text"
        value={value}
      />
    );
  }
}
