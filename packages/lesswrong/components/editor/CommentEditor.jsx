import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent, withCurrentUser } from 'meteor/vulcan:core';
import bowser from 'bowser';

class CommentEditor extends Component {
  constructor (props,context) {
    super(props,context);
    this.state  = {
      editor: (props) => <Components.Loading />
    }
  }

  markDownEditor = () => {
    if (Meteor.isClient &&
        window &&
        window.navigator &&
        window.navigator.userAgent) {
        if (bowser.mobile || bowser.tablet) {
          return true
        }
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
          />
          :
          <AsyncCommentEditor {...this.props}/>
        }
      </div>
    )
  }
}

registerComponent('CommentEditor', CommentEditor, withCurrentUser);
