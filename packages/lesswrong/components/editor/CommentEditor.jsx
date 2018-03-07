import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent, withCurrentUser } from 'meteor/vulcan:core';

class CommentEditor extends Component {
  constructor (props,context) {
    super(props,context);
    this.state  = {
      editor: (props) => <Components.Loading />
    }
  }

  markDownEditor = () => {
    if (window.document.userAgent && window.document.userAgent.includes("Android")) {
      return true
    }
    return this.props.currentUser.markDownEditor
  }

  async componentWillMount() {
    const {default: Editor} = await import('../async/AsyncCommentEditor.jsx');
    this.setState({editor: Editor});
  }

  render() {
    const AsyncCommentEditor = this.state.editor;
    return (
      <div className="comment-editor">
        { this.markDownEditor() ?
          <Components.MuiTextField
            {...this.props}
            hintText="Plain Markdown Editor"
            name="body"
            rows={4}
            multiLine={true}
            fullWidth={true}
            underlineShow={false}
          />
          :
          <AsyncCommentEditor {...this.props}/>
        }
      </div>
    )
  }
}

registerComponent('CommentEditor', CommentEditor, withCurrentUser);
