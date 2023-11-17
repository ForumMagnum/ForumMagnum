// Copied and slightly adjusted from: https://raw.githubusercontent.com/draft-js-plugins/draft-js-plugins/master/draft-js-anchor-plugin/src/components/LinkButton/AddLinkForm.js

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import unionClassNames from 'union-class-names';
import prependHttp from 'prepend-http';
const mailRegex = /^((mailto:[^<>()/[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
import { editorStateSettingExplicitLink, isURL as isUrl } from '../linkifyPlugin'

function isMail(text) {
    return mailRegex.test(text);
}

function normaliseMail(email) {
    if (email.toLowerCase().startsWith('mailto:')) {
        return email;
    }
    return `mailto:${email}`;
}

function normalizeUrl(url) {
    return prependHttp(url);
}

export default class AddLinkForm extends Component {
  static propTypes = {
    getEditorState: PropTypes.func.isRequired,
    setEditorState: PropTypes.func.isRequired,
    onOverrideContent: PropTypes.func.isRequired,
    placeholder: PropTypes.string
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
    if (this.state.isInvalid && isUrl(normalizeUrl(value))) {
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

  submit() {
    const { getEditorState, setEditorState } = this.props;
    let { value: url } = this.state;
    if (!isMail(normaliseMail(url))) {
      url = normalizeUrl(url);
      if (!isUrl(url)) {
        this.setState({ isInvalid: true });
        return;
      }
    } else {
      url = normaliseMail(url);
    }
    setEditorState(editorStateSettingExplicitLink(getEditorState(), url))
    this.input.blur();
    this.onClose();
  }

  render() {
    const {
      placeholder
    } = this.props;
    const { value, isInvalid } = this.state;
    const className = isInvalid
      ? unionClassNames("input", "inputInvalid")
      : "input";

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
