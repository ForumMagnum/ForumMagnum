import React, { PropTypes, Component } from 'react';
import { Components, registerComponent, getDynamicComponent } from 'meteor/vulcan:core';


class EditorFormComponent extends Component {
  constructor (props,context) {
    super(props,context);
    this.Editor = (props) => <Components.Loading />
  }

  async componentWillMount() {
    const {default: Editor} = await import('../async/AsyncEditorFormComponent.jsx');
    this.Editor = Editor;
  }

  render() {
    const AsyncEditorFormComponent = this.Editor;
    return (
      <AsyncEditorFormComponent {...this.props}/>
    )
  }
}

registerComponent('EditorFormComponent', EditorFormComponent);
