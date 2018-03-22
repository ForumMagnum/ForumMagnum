import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent, withCurrentUser } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';

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
    const { currentUser, enableMarkDownEditor } = this.props
    return (
      <div className="post-editor">
        { enableMarkDownEditor && Users.useMarkdownPostEditor(currentUser) ?
          <Components.MuiTextField
            {...this.props}
            name="body"
          />
          :
          <AsyncEditor {...this.props}/>
        }
      </div>

    )
  }
}

registerComponent('EditorFormComponent', EditorFormComponent, withCurrentUser);
