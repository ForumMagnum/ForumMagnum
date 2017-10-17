import React, { PropTypes, Component } from 'react';

/*
  HoC that queries the current context and passes a reference to the global editor object to the
  wrapped component.
*/

function withEditor(WrappedComponent) {
  class EditorWrapped extends Component {
    componentWillMount() {
      this.context.editor.trigger.mode.edit();
    }
    render() {
      return <WrappedComponent editor={this.context.editor} showAdvanced={this.context.showAdvanced} {...this.props} />
    }
  }

  EditorWrapped.contextTypes = {
    editor: PropTypes.object,
    showAdvanced: PropTypes.boolean,
  };

  return EditorWrapped;
}

export default withEditor;
