import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent, withCurrentUser } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';

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
    const currentUser = this.props.currentUser;
    return (
      <div className="comment-editor">
        { Users.useMarkdownCommentEditor(currentUser) ?
          <Components.MuiTextField
            {...this.props}
          />
          :
          <AsyncCommentEditor {...this.props}/>
        }
      </div>
    )
  }
}

registerComponent('CommentEditor', CommentEditor, withCurrentUser);
