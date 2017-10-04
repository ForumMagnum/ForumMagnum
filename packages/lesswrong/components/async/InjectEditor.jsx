import React, { PropTypes, Component } from 'react';
import ReactDOM from 'react-dom';

import { Components, registerComponent, getDynamicComponent} from 'meteor/vulcan:core';

/*
  HoC that instiatiates a new Editor and adds the editor instance to context. The context API is generally discouraged, but I don't want to
  set up all of Redux to give us access to a single global variable, so this is what we will have to deal with for now. I will try to find a solution
  without using the context API at some later point in time. PRs are encouraged.

  The HoC passes the editor object both to context, and to the wrapped component, for convenience.

  TODO: Figure out a way to do this without using context
*/


class InjectEditor extends Component {
  constructor(props) {
    const Editor = (props) => getDynamicComponent(import('ory-editor-core'));
    const slate = (props) => getDynamicComponent(import('ory-editor-plugins-slate'));
    const spacer = (props) => getDynamicComponent(import('ory-editor-plugins-spacer'));
    const image = (props) => getDynamicComponent(import('ory-editor-plugins-image'));
    const video = (props) => getDynamicComponent(import('ory-editor-plugins-video'));
    const divider = (props) => getDynamicComponent(import('ory-editor-plugins-divider'));
    super(props);
    let editables = this.props.editables;
    const plugins = {
      content: [slate(), spacer, image, video, divider],
    }
    const editor = new Editor({
      plugins,
      // pass the content state - you can add multiple editables here
      editables: editables,
      defaultPlugin: slate(),
    })
    this.editor = editor;
  }
  getChildContext() {
    return {editor: this.editor};
  }
  render() {
    return <div className="inject-editor"> {this.props.children} </div>
  }
}
InjectEditor.childContextTypes = {
  editor: PropTypes.object,
};

export default InjectEditor
