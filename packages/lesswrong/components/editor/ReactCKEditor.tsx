/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getCkEditor } from '../../lib/wrapCkEditor';
import type EditorWatchdog from '@ckeditor/ckeditor5-watchdog/src/editorwatchdog';
import type BalloonBlockEditorBase from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';
import type { EditorConfig } from '@ckeditor/ckeditor5-core/src/editor/editorconfig';

export interface CKEditorProps {
  data?: any,
  editor: typeof BalloonBlockEditorBase,
  disabled?: any,
  onInit?: (editor: BalloonBlockEditorBase) => void,
  onChange?: any,
  onFocus?: any,
  onBlur?: any,
  config?: EditorConfig,
}

// Copied from and modified: https://github.com/ckeditor/ckeditor5-react/blob/master/src/ckeditor.jsx
export default class CKEditor extends React.Component<CKEditorProps,{ firstRender: boolean }> {
  domContainer: React.RefObject<HTMLDivElement>
  watchdog: EditorWatchdog
  editor: BalloonBlockEditorBase | null
  
  constructor(props: CKEditorProps) {
    super( props );

    // After mounting the editor, the variable will contain a reference to the created editor.
    // @see: https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editor-Editor.html
    this.editor = null;
    this.domContainer = React.createRef();
    const { EditorWatchdog } = getCkEditor();
    this.watchdog = new EditorWatchdog()
    global.editor = this;
  }
  
  // This component should never be updated by React itself.
  shouldComponentUpdate( nextProps ) {
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
    this._initializeEditor().catch((err) => this.setState(() => { throw err; }))
    // try {
    // } catch (error) {
    //   console.log({ error }, 'caught error in ReactCKEditor.componentDidMount');
    //   throw error;
    // }
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

  _innerInit(editor: BalloonBlockEditorBase) {
    // if (!this.state?.firstRender) {
    //   this.setState({ firstRender: true });
    //   throw new Error('test failing editor creation!');
    // }

    this.editor = editor;
          
    if ( 'disabled' in this.props ) {
      editor.isReadOnly = this.props.disabled;
    }
    
    if ( this.props.onInit ) {
      this.props.onInit( editor );
    }
    
    const modelDocument = editor.model.document;
    const viewDocument = editor.editing.view.document;
    
    modelDocument.on( 'change:data', event => {
      /* istanbul ignore else */
      if ( this.props.onChange ) {
        this.props.onChange( event, editor );
      }
    } );
    
    viewDocument.on( 'focus', event => {
      /* istanbul ignore else */
      if ( this.props.onFocus ) {
        this.props.onFocus( event, editor );
      }
    } );
    
    viewDocument.on( 'blur', event => {
      /* istanbul ignore else */
      if ( this.props.onBlur ) {
        this.props.onBlur( event, editor );
      }
    } );
    return editor
  }
    
  async _initializeEditor() {

    const oldCreate = this.props.editor.create.bind(this.props.editor);

    this.props.editor.create = async (...[el, config]: Parameters<typeof this.props.editor.create>) => {
      const builtinPlugins = this.props.editor.builtinPlugins;
      const removePlugins = config?.removePlugins;
      const realTimeCollaborativeEditingPlugin = builtinPlugins.find((plugin) => typeof plugin !== 'string' && plugin.pluginName === 'RealTimeCollaborativeEditing');
      if (realTimeCollaborativeEditingPlugin && !removePlugins?.includes(realTimeCollaborativeEditingPlugin)) {
        throw new Error('test failing editor creation due to realTimeCollaborativeEditingPlugin!');
      }

      console.log({ el, config });

      return oldCreate(el, config);
    };

    Object.assign(this.props.editor.create, { modified: true });
    
    this.watchdog.setCreator((el, config) => {
      return this.props.editor
        .create( el , config )
        .then((e) => this._innerInit(e), (error) => {
          console.log({ error }, 'in extra then.catch block of _initializeEditor');
          throw error;
        })
        // .catch( error => {
        //   // eslint-disable-next-line no-console
        //   console.error( error );
        //   // const builtinPlugins = this.props.editor.builtinPlugins;
        //   // const realTimeCollaborativeEditingPlugin = builtinPlugins.find((plugin) => typeof plugin !== 'string' && plugin.pluginName === 'RealTimeCollaborativeEditing');
        //   // if (realTimeCollaborativeEditingPlugin) {
        //   //   if (!config) config = {};
        //   //   if (!config.removePlugins) config.removePlugins = [];
        //     // config.removePlugins.push(realTimeCollaborativeEditingPlugin);

        //     // console.log({ builtinPlugins, removePlugins: config?.removePlugins, realTimeCollaborativeEditingPlugin, createFunc: this.props.editor.create })
        //     // return this.props.editor.create(el, config).then((e) => this._innerInit(e));
        //   // }
        //   throw error;
        // } );
    })
    this.watchdog.setDestructor(editor => editor.destroy())
    // eslint-disable-next-line no-console
    this.watchdog.on( 'error', () => { console.log( 'Editor crashed.' ) } );
    // eslint-disable-next-line no-console
    this.watchdog.on( 'restart', () => { console.log( 'Editor was restarted.' ) } );

    await this.watchdog.create(this.domContainer.current, this.props.config)
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
    
  _shouldUpdateContent( nextProps ) {
    // Check whether `nextProps.data` is equal to `this.props.data` is required if somebody defined the `#data`
    // property as a static string and updated a state of component when the editor's content has been changed.
    // If we avoid checking those properties, the editor's content will back to the initial value because
    // the state has been changed and React will call this method.
    if ( this.props.data === nextProps.data ) {
      return false;
    }
    
    // We should not change data if the editor's content is equal to the `#data` property.
    if ( this.editor?.getData() === nextProps.data ) {
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
