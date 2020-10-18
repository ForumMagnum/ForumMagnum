import React, { Component } from 'react'
import PropTypes from 'prop-types'
import EditorForm from './EditorForm'
import { isClient } from '../../lib/executionEnvironment';

interface EditorFormContainerProps {
  className: string,
  form: any,
}
interface EditorFormContainerState {
  editorState: any,
}

class EditorFormContainer extends Component<EditorFormContainerProps,EditorFormContainerState> {
  onChange: any
  
  render() {
    const { className } = this.props;
    const { editorState } = this.state;
    return (
      <EditorForm
        isClient={isClient}
        editorState={editorState}
        onChange={this.onChange}
        commentEditor={this.props.form && this.props.form.commentEditor}
        className={className}
      />
    )
  }
}

(EditorFormContainer as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
};

export default EditorFormContainer;
