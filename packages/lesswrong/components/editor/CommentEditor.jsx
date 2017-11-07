import React, { PropTypes, Component } from 'react';
import { Components, registerComponent, getDynamicComponent } from 'meteor/vulcan:core';


class CommentEditor extends Component {
  constructor (props,context) {
    super(props,context);
    this.state  = {
      editor: (props) => <Components.Loading />
    }
  }

  async componentWillMount() {
    const {default: Editor} = await import('../async/AsyncCommentEditor.jsx');
    this.setState({editor: Editor});
  }

  render() {
    const AsyncCommentEditor = this.state.editor;
    return (
      <AsyncCommentEditor {...this.props}/>
    )
  }
}

registerComponent('CommentEditor', CommentEditor);
