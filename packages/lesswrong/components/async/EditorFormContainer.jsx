import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { getLSHandlers } from './localStorageHandlers.js'
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import { htmlToDraft } from '../../lib/editor/utils.js'
import { Utils } from 'meteor/vulcan:core';
import EditorForm from './EditorForm'

class EditorFormContainer extends Component {
  render() {
    const { className } = this.props;
    const { editorState } = this.state;
    return (
      <EditorForm
        isClient={Meteor.isClient}
        editorState={editorState}
        onChange={this.onChange}
        commentEditor={this.props.form && this.props.form.commentEditor}
        className={className}
      />
    )
  }
}

EditorFormContainer.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
};

export default EditorFormContainer;
