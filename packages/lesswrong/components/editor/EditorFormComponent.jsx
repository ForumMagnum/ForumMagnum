import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent } from 'meteor/vulcan:core';


class EditorFormComponent extends Component {
  constructor (props,context) {
    super(props,context);
    this.state  = {
      editor: (props) => <Components.Loading />
    }
  }

  async componentWillMount() {
    const {default: Editor} = await import('../async/AsyncEditorFormComponent.jsx');
    this.setState({editor: Editor});
  }

  render() {
    const AsyncEditor = this.state.editor;
    return (
      <AsyncEditor {...this.props}/>
    )
  }
}

registerComponent('EditorFormComponent', EditorFormComponent);
