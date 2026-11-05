/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 *
 * Vendored from https://github.com/ckeditor/ckeditor5-react
 * commit 93d7c69b64a5d13dcac79a17794dc278f4d06fb7, with the watchdog replaced
 * by `onEditorError` error reporting as in ckeditor5-react v12.0.0.
 */
/* eslint-disable no-tabs */
/* eslint-disable no-console */

/* globals window */

import React from 'react';
import PropTypes, { InferProps, Validator } from 'prop-types';

import type { EventInfo, Editor, EditorConfig, EditorErrorCallback, ModelDocumentChangeEvent as DocumentChangeEvent } from 'ckeditor5';

import { WrappedEditorConfig } from '@/components/editor/editorConfigs';

const REACT_INTEGRATION_READ_ONLY_LOCK_ID = 'Lock from React integration (@ckeditor/ckeditor5-react)';

export default class CKEditor<TEditor extends Editor> extends React.Component<Props<TEditor> & {
  isCollaborative: boolean
  config: WrappedEditorConfig
}, {}> {
	/**
	 * Contains a promise that resolves when the editor destruction is finished.
	 */
	private editorDestructionInProgress: Promise<void> | null = null;

	/**
	 * After mounting the editor, the variable will contain a reference to the created editor.
	 * @see: https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editor-Editor.html
	 */
	private domContainer = React.createRef<HTMLDivElement>();

	/**
	 * Resolves to the editor being created, or to null if its creation failed.
	 */
	private editorCreation: Promise<TEditor | null> | null = null;

	/**
	 * Holds the instance of the editor once it has been created.
	 */
	private instance: TEditor | null = null;

	/**
	 * Unregisters the error reporting callback when the editor goes away.
	 */
	private offEditorError: ( () => void ) | null = null;

	constructor( props: Props<TEditor> & { isCollaborative: boolean, config: WrappedEditorConfig } ) {
		super( props );

		const { CKEDITOR_VERSION } = window;

		if ( CKEDITOR_VERSION ) {
			const [ major ] = CKEDITOR_VERSION.split( '.' ).map( Number );

			if ( major < 49 ) {
				console.warn( 'The <CKEditor> component requires using CKEditor 5 in version 49 or higher.' );
			}
		} else {
			console.warn( 'Cannot find the "CKEDITOR_VERSION" in the "window" scope.' );
		}
	}

	/**
	 * An editor instance.
	 */
	public get editor(): Editor | null {
		return this.instance;
	}

	/**
	 * The CKEditor component should not be updated by React itself.
	 * However, if the component identifier changes, the whole structure should be created once again.
	 */
	public override shouldComponentUpdate( nextProps: Readonly<Props<TEditor>> ): boolean {
		if ( !this.editor ) {
			return false;
		}

		// Only when the component identifier changes the whole structure should be re-created once again.
		if ( nextProps.id !== this.props.id ) {
			return true;
		}

		if ( this._shouldUpdateEditor( nextProps ) ) {
			this.editor.data.set( nextProps.data! );
		}

		if ( 'disabled' in nextProps ) {
			if ( nextProps.disabled ) {
				this.editor.enableReadOnlyMode( REACT_INTEGRATION_READ_ONLY_LOCK_ID );
			} else {
				this.editor.disableReadOnlyMode( REACT_INTEGRATION_READ_ONLY_LOCK_ID );
			}
		}

		return false;
	}

	/**
	 * Initialize the editor when the component is mounted.
	 */
	public override async componentDidMount(): Promise<void> {
		await this._initializeEditor();
	}

	/**
	 * Re-render the entire component once again. The old editor will be destroyed and the new one will be created.
	 */
	public override async componentDidUpdate(): Promise<void> {
		await this._destroyEditor();
		await this._initializeEditor();
	}

	/**
	 * Destroy the editor before unmounting the component.
	 */
	public override async componentWillUnmount(): Promise<void> {
		await this._destroyEditor();
	}

	/**
	 * Render a <div> element which will be replaced by CKEditor.
	 */
	public override render(): React.ReactNode {
		return (
			<div ref={ this.domContainer }></div>
		);
	}

	/**
	 * Creates the editor and starts reporting the errors that escape it.
	 */
	private async _initializeEditor(): Promise<void> {
		await this.editorDestructionInProgress;

		const editorCreation = this._createEditor( this._getConfig() )
			.catch( error => {
				const onError = this.props.onError || console.error;
				onError( error, { phase: 'initialization' } );
				return null;
			} );
		this.editorCreation = editorCreation;

		const instance = await editorCreation;

		// If the editor was destroyed while it was being created, `_destroyEditor` disposes of it.
		if ( !instance || this.editorCreation !== editorCreation ) {
			return;
		}

		this.instance = instance;
		this.offEditorError = this.props.editor.onEditorError( ( { error, source } ) => {
			if ( source !== instance ) {
				return;
			}

			const onError = this.props.onError || console.error;
			onError( error, { phase: 'runtime' } );
		} );
	}

	/**
	 * Creates an editor from the configuration.
	 *
	 * @param config CKEditor 5 editor configuration.
	 */
	private _createEditor( config: EditorConfig ): Promise<TEditor> {
		return this.props.editor.create( config )
			.then( editor => {
				if ( 'disabled' in this.props ) {
					// Switch to the read-only mode if the `[disabled]` attribute is specified.
					/* istanbul ignore else */
					if ( this.props.disabled ) {
						editor.enableReadOnlyMode( REACT_INTEGRATION_READ_ONLY_LOCK_ID );
					}
				}

				const modelDocument = editor.model.document;
				const viewDocument = editor.editing.view.document;

				modelDocument.on<DocumentChangeEvent>( 'change:data', event => {
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

				// The `onReady` callback should be fired once the `editor` property
				// can be reached from the `<CKEditor>` component.
				setTimeout( () => {
					if ( this.props.onReady ) {
						this.props.onReady( editor );
					}
				} );

				return editor;
			} );
	}

	/**
	 * Destroys the editor, waiting for it to finish being created if necessary, and stops reporting its errors.
	 */
	private async _destroyEditor(): Promise<void> {
		const { editorCreation } = this;

		this.offEditorError?.();
		this.offEditorError = null;
		this.editorCreation = null;
		this.instance = null;

		this.editorDestructionInProgress = ( async () => {
			const editor = await editorCreation;
			await editor?.destroy();
		} )();
	}

	/**
	 * Returns true when the editor should be updated.
	 *
	 * @param nextProps React's properties.
	 */
	private _shouldUpdateEditor( nextProps: Readonly<Props<TEditor>> ): boolean {
    // HACK: In collaborative editing mode, ignore prop changes to `data`.
    // In collab editing mode, that will crash the editor with
    //   `realtimecollaborationclient-editor-setdata-and-editor-data-set-are-forbidden-in-real-time-collaborat ion`
    //
    // In theory, the `data` prop getting passed around and the document
    // state inside the editor are supposed to be kept in sync. In practice,
    // due to debouncing and subtleties of render timing, there are race
    // conditions/corner cases where they aren't.
    //
    // This means that changing the editor contents from outside the editor
    // won't work (eg, clearing the input, restoring from local storage). In
    // practice, scenarios where this is supposed to happen don't overlap
    // much with scenarios where this is in collaborative editing mode.
		if (this.props.isCollaborative) {
			return false;
		}

		// Check whether `nextProps.data` is equal to `this.props.data` is required if somebody defined the `#data`
		// property as a static string and updated a state of component when the editor's content has been changed.
		// If we avoid checking those properties, the editor's content will back to the initial value because
		// the state has been changed and React will call this method.
		if ( this.props.data === nextProps.data ) {
			return false;
		}

		// We should not change data if the editor's content is equal to the `#data` property.
		if ( this.editor!.data.get() === nextProps.data ) {
			return false;
		}

		return true;
	}

	/**
	 * Returns the editor configuration.
	 */
	private _getConfig(): EditorConfig {
		const config = this.props.config || {};

		if ( this.props.data && config.root?.initialData ) {
			console.warn(
				'Editor data should be provided either using `config.root.initialData` or `content` property. ' +
				'The config value takes precedence over `content` property and will be used when both are specified.'
			);
		}

		// Merge two possible ways of providing data into the `config.root.initialData` field.
		return {
			...config,
			root: {
				...config.root,
				element: this.domContainer.current!,
				initialData: config.root?.initialData || this.props.data || ''
			}
		};
	}

	// Properties definition.
	public static propTypes = {
		editor: PropTypes.func.isRequired as unknown as Validator<EditorConstructor<any>>,
		data: PropTypes.string,
		config: PropTypes.object,
		onChange: PropTypes.func,
		onReady: PropTypes.func,
		onFocus: PropTypes.func,
		onBlur: PropTypes.func,
		onError: PropTypes.func,
		disabled: PropTypes.bool,
		id: PropTypes.any
	};
}

/**
 * The editor class, as handed over by the editor bundle. Error reporting is reached through it rather than
 * imported, since importing a value from CKEditor would pull the npm build into the main bundle.
 */
interface EditorConstructor<TEditor extends Editor> {
	create( config: EditorConfig ): Promise<TEditor>;
	onEditorError( callback: EditorErrorCallback ): () => void;
}

/**
 * TODO this is type space definition for props, the CKEditor.propTypes is a run-time props validation that should match.
 */
interface Props<TEditor extends Editor> extends InferProps<typeof CKEditor.propTypes> {
	editor: EditorConstructor<TEditor>;
	config?: EditorConfig;
	onReady?: ( editor: TEditor ) => void;
	onError?: ( error: Error, details: ErrorDetails ) => void;
	onChange?: ( event: EventInfo, editor: TEditor ) => void;
	onFocus?: ( event: EventInfo, editor: TEditor ) => void;
	onBlur?: ( event: EventInfo, editor: TEditor ) => void;
}

interface ErrorDetails {
	phase: 'initialization' | 'runtime';
}
