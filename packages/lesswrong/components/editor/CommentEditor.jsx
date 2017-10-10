import React, { PropTypes, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Editable, createEmptyState } from 'ory-editor-core';
import { Toolbar } from 'ory-editor-ui'
import withEditor from './withEditor.jsx'

import ls from 'local-storage';

class CommentEditor extends Component {
  constructor(props, context) {
    super(props,context);
    let editor = this.props.editor;
    const document = this.props.document;
    let state = document && document.content ? document.content : createEmptyState();

    // Check whether we have a state from a previous session saved (in localstorage)
    const savedState = this.getSavedState();
    if (savedState) { state = savedState }

    this.state = {
      contentState: state,
    };
    editor.trigger.editable.add(state);
  }

  // Tries to retrieve a saved state from localStorage, depending on the available information
  getSavedState = () => {
    const document = this.props.document;
    if (document && document._id) { // When restoring the edit state for a specific comment, ask for permission
      const savedState = ls.get(document._id);
      if (savedState && window) {
        const result = window.confirm("We've found a previously saved state for this comment, would you like to restore it?")
        if (result) { return ls.get(document._id) }
      } else {
        return null;
      }
    } else if (document && document.parentCommentId) {
      return ls.get('parent:' +  document.parentCommentId)
    } else if (document && document.postId) {
      return ls.get('post:' + document.postId)
    } else {
      return null
    }
  }


  // Saves the passed state to localStorage, depending on the available information
  setSavedState = (state) => {
    const document = this.props.document;
    if (document && document._id) {
      ls.set(document._id, state);
    } else if (document && document.parentCommentId) {
      ls.set('parent:' + document.parentCommentId, state);
    } else if (document && document.postId, state) {
      ls.set('post:' + document.postId, state);
    }
  }

  componentWillMount() {
    //Add function for resetting form to form submit callbacks
    const resetEditor = (result) => {
      // On Form submit, create a new empty editable
      let editor = this.props.editor;
      let state = createEmptyState();
      editor.trigger.editable.add(state);
      this.setState({
        contentState: state,
      });
      return result;
    }
    this.context.addToSuccessForm(resetEditor);
  }

  render() {
    const addValues = this.context.addToAutofilledValues;
    let editor = this.props.editor;
    const onChange = (state) => {
      this.setSavedState(state);
      addValues({content: state});
      return state;
    }
    return (
      <div className="commentEditor">
        <Editable editor={editor} id={this.state.contentState.id} onChange={onChange} />
        <Toolbar editor={editor} />
      </div>
    )
  }
}

CommentEditor.contextTypes = {
  addToAutofilledValues: React.PropTypes.func,
  addToSuccessForm: React.PropTypes.func,
};

registerComponent('CommentEditor', CommentEditor, withEditor);
