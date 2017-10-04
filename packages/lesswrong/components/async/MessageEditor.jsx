// import React, { PropTypes, Component } from 'react';
// import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
// import { Editable, createEmptyState } from 'ory-editor-core';
// import { Toolbar } from 'ory-editor-ui'
// import withEditor from './withEditor.jsx'
//
// class MessageEditor extends Component {
//   constructor(props, context) {
//     super(props,context);
//     let editor = this.props.editor;
//     const document = this.props.document;
//     let state = document && document.content ? document.content : createEmptyState();
//     this.state = {
//       contentState: state,
//     };
//     editor.trigger.editable.add(state);
//   }
//
//   componentWillMount() {
//     //Add function for resetting form to form submit callbacks
//     const resetEditor = (data) => {
//       // On Form submit, create a new empty editable
//       let editor = this.props.editor;
//       let state = createEmptyState();
//       editor.trigger.editable.add(state);
//       this.setState({
//         contentState: state,
//       })
//       return data;
//     }
//     const addToSubmitCallbacks = this.context.addToSubmitForm;
//     addToSubmitCallbacks(resetEditor);
//   }
//
//   render() {
//     const document = this.props.document;
//     const addValues = this.context.addToAutofilledValues;
//     let editor = this.props.editor;
//     const onChange = (state) => {
//       addValues({content: state});
//       return state;
//     }
//     return (
//       <div className="commentEditor">
//         <Editable editor={editor} id={this.state.contentState.id} onChange={onChange} />
//         <Toolbar editor={editor} />
//       </div>
//     )
//   }
// }
//
// MessageEditor.contextTypes = {
//   addToAutofilledValues: React.PropTypes.func,
//   addToSubmitForm: React.PropTypes.func,
// }
//
// // registerComponent('MessageEditor', MessageEditor, withEditor, withCurrentUser);
//
// export default withEditor(MessageEditor);
