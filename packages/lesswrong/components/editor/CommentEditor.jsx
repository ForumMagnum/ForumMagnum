import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
    console.log("CommentEditor props", this.props);
    return (
      <div>
        <AsyncCommentEditor {...this.props}/>
        <Components.ModerationGuidelinesBox showModeratorAssistance documentId={this.props.document.postId}/>
      </div>
    )
  }
}

registerComponent('CommentEditor', CommentEditor);
