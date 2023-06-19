/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getCkEditor } from '../../lib/wrapCkEditor';

interface CKEditorProps {
  data?: any,
  editor: any,
  disabled?: any,
  onInit?: any,
  onChange?: any,
  onFocus?: any,
  onBlur?: any,
  config?: any,
}

// Copied from and modified: https://github.com/ckeditor/ckeditor5-react/blob/master/src/ckeditor.jsx
export default class CKEditor extends React.Component<CKEditorProps,{}> {
  domContainer: any
  watchdog: any
  editor: any
  
  constructor(props: CKEditorProps) {
    super( props );
    
    // After mounting the editor, the variable will contain a reference to the created editor.
    // @see: https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editor-Editor.html
    this.editor = null;
    this.domContainer = React.createRef();
    const { EditorWatchdog } = getCkEditor();
    this.watchdog = new EditorWatchdog()
  }
  
  // This component should never be updated by React itself.
  shouldComponentUpdate( nextProps: CKEditorProps ) {
    if ( !this.editor ) {
      return false;
    }
    
    if ( this._shouldUpdateContent( nextProps ) ) {
      this.editor.setData( nextProps.data );
    }
    
    if ( 'disabled' in nextProps ) {
      this.editor.isReadOnly = nextProps.disabled;
    }
    
    return false;
  }
  
  // Initialize the editor when the component is mounted.
  componentDidMount() {
    this._initializeEditor();
  }
  
  // Destroy the editor before unmouting the component.
  componentWillUnmount() {
    this._destroyEditor();
  }
  
  // Render a <div> element which will be replaced by CKEditor.
  render() {
    // We need to inject initial data to the container where the editable will be enabled. Using `editor.setData()`
    // is a bad practice because it initializes the data after every new connection (in case of collaboration usage).
    // It leads to reset the entire content. See: #68
    return (
      <div ref={ this.domContainer } ></div>
    );
  }
    
  _initializeEditor() {
    this.watchdog.setCreator((el: any, config: any) => {
      return this.props.editor
        .create( el , config )
        .then((editor: any) => {
          this.editor = editor;
          
          if ( 'disabled' in this.props ) {
            editor.isReadOnly = this.props.disabled;
          }
          
          if ( this.props.onInit ) {
            this.props.onInit( editor );
          }
          
          const modelDocument = editor.model.document;
          const viewDocument = editor.editing.view.document;
          
          modelDocument.on( 'change:data', (event: any) => {
            /* istanbul ignore else */
            if ( this.props.onChange ) {
              this.props.onChange( event, editor );
            }
          } );
          
          viewDocument.on( 'focus', (event: any) => {
            /* istanbul ignore else */
            if ( this.props.onFocus ) {
              this.props.onFocus( event, editor );
            }
          } );
          
          viewDocument.on( 'blur', (event: any) => {
            /* istanbul ignore else */
            if ( this.props.onBlur ) {
              this.props.onBlur( event, editor );
            }
          } );
          return editor
        } )
        .catch( (error: any) => {
          // eslint-disable-next-line no-console
          console.error( error );
        } );
    })
    this.watchdog.setDestructor((editor: any) => editor.destroy())
    this.watchdog.create(this.domContainer.current, this.props.config)
    // eslint-disable-next-line no-console
    this.watchdog.on( 'error', () => { console.log( 'Editor crashed.' ) } );
    // eslint-disable-next-line no-console
    this.watchdog.on( 'restart', () => { console.log( 'Editor was restarted.' ) } );
  }
    
  _destroyEditor() {
    if ( this.watchdog && this.editor ) {
      // We should probably call watchdog.destroy() here instead, but that seems to reliably result in errors I don't understand. So there is some chance this is causing some memory leaks. 
      // See this issue: https://github.com/ckeditor/ckeditor5/issues/5897
      this.editor.destroy()
        .then( () => {
          this.editor = null;
        } );
    }
  }
    
  _shouldUpdateContent( nextProps: CKEditorProps ) {
    // Check whether `nextProps.data` is equal to `this.props.data` is required if somebody defined the `#data`
    // property as a static string and updated a state of component when the editor's content has been changed.
    // If we avoid checking those properties, the editor's content will back to the initial value because
    // the state has been changed and React will call this method.
    if ( this.props.data === nextProps.data ) {
      return false;
    }
    
    // We should not change data if the editor's content is equal to the `#data` property.
    if ( this.editor.getData() === nextProps.data ) {
      return false;
    }
    
    return true;
  }
};

// Properties definition.
(CKEditor as any).propTypes = {
  editor: PropTypes.func.isRequired,
  data: PropTypes.string,
  config: PropTypes.object,
  onChange: PropTypes.func,
  onInit: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool
};

// Default values for non-required properties.
(CKEditor as any).defaultProps = {
  config: {}
};
