/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals window */

import React from 'react';
import PropTypes from 'prop-types';
import EditorWatchdog from '@ckeditor/ckeditor5-watchdog/src/editorwatchdog';
import uid from '@ckeditor/ckeditor5-utils/src/uid';
import { ContextWatchdogContext } from './ckeditorcontext.jsx';
import ContextWatchdog from '@ckeditor/ckeditor5-watchdog/src/contextwatchdog';

const REACT_INTEGRATION_READ_ONLY_LOCK_ID = 'Lock from React integration (@ckeditor/ckeditor5-react)';

export default class CKEditor extends React.Component {
	constructor( props ) {
		super( props );

		// After mounting the editor, the variable will contain a reference to the created editor.
		// @see: https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editor-Editor.html
		this.domContainer = React.createRef();

		/**
		 * An instance of EditorWatchdog or an instance of EditorWatchdog-like adapter for ContextWatchdog.
		 *
		 * @type {module:watchdog/watchdog~Watchdog|EditorWatchdogAdapter}
		 */
		this.watchdog = null;

		const { CKEDITOR_VERSION } = window;

		// Starting from v34.0.0, CKEditor 5 introduces a lock mechanism enabling/disabling the read-only mode.
		// As it is a breaking change between major releases of the integration, the component requires using
		// CKEditor 5 in version 34 or higher.
		if ( CKEDITOR_VERSION ) {
			const [ major ] = CKEDITOR_VERSION.split( '.' ).map( Number );

			if ( major < 34 ) {
				console.warn( 'The <CKEditor> component requires using CKEditor 5 in version 34 or higher.' );
			}
		} else {
			console.warn( 'Cannot find the "CKEDITOR_VERSION" in the "window" scope.' );
		}
	}

	/**
	 * An editor instance.
	 *
	 * @type {module:core/editor/editor~Editor|null}
	 */
	get editor() {
		if ( !this.watchdog ) {
			return null;
		}

		return this.watchdog.editor;
	}

	/**
	 * The CKEditor component should not be updated by React itself.
	 * However, if the component identifier changes, the whole structure should be created once again.
	 *
	 * @param {Object} nextProps
	 * @return {Boolean}
	 */
	shouldComponentUpdate( nextProps ) {
		if ( !this.editor ) {
			return false;
		}

		// Only when the component identifier changes the whole structure should be re-created once again.
		if ( nextProps.id !== this.props.id ) {
			return true;
		}

		if ( this._shouldUpdateEditor( nextProps ) ) {
			this.editor.setData( nextProps.data );
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
	 *
	 * @returns {Promise}
 	 */
	async componentDidMount() {
		await this._initializeEditor();
	}

	/**
	 * Re-render the entire component once again. The old editor will be destroyed and the new one will be created.
	 *
	 * @returns {Promise}
	 */
	async componentDidUpdate() {
		await this._destroyEditor();
		await this._initializeEditor();
	}

	/**
	 * Destroy the editor before unmounting the component.
	 *
	 * @returns {Promise}
 	 */
	async componentWillUnmount() {
		await this._destroyEditor();
	}

	/**
	 * Render a <div> element which will be replaced by CKEditor.
	 *
	 * @return {JSX.Element}
	 */
	render() {
		return (
			<div ref={ this.domContainer }></div>
		);
	}

	/**
	 * Initializes the editor by creating a proper watchdog and initializing it with the editor's configuration.
	 *
	 * @private
	 * @returns {Promise}
	 */
	async _initializeEditor() {
		if ( this.watchdog ) {
			return;
		}

		if ( this.context instanceof ContextWatchdog ) {
			this.watchdog = new EditorWatchdogAdapter( this.context );
		} else {
			this.watchdog = new CKEditor._EditorWatchdog( this.props.editor );
		}

		this.watchdog.setCreator( ( el, config ) => this._createEditor( el, config ) );

		this.watchdog.on( 'error', ( _, { error, causesRestart } ) => {
			this.props.onError( error, { phase: 'runtime', willEditorRestart: causesRestart } );
		} );

		await this.watchdog.create( this.domContainer.current, this._getConfig() )
			.catch( error => this.props.onError( error, { phase: 'initialization', willEditorRestart: false } ) );
	}

	/**
	 * Creates an editor from the element and configuration.
	 *
	 * @private
	 * @param {HTMLElement} element The source element.
	 * @param {Object} config CKEditor 5 editor configuration.
	 * @returns {Promise}
	 */
	_createEditor( element, config ) {
		return this.props.editor.create( element, config )
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

				// The `onReady` callback should be fired once the `editor` property
				// can be reached from the `<CKEditor>` component.
				// Ideally this part should be moved to the watchdog item creator listeners.
				setTimeout( () => {
					if ( this.props.onReady ) {
						this.props.onReady( this.editor );
					}
				} );

				return editor;
			} );
	}

	/**
	 * Destroys the editor by destroying the watchdog.
	 *
	 * @private
	 * @returns {Promise}
	 */
	async _destroyEditor() {
		// It may happen during the tests that the watchdog instance is not assigned before destroying itself. See: #197.
		/* istanbul ignore next */
		if ( !this.editor ) {
			return;
		}

		await this.watchdog.destroy();
		this.watchdog = null;
	}

	/**
	 * Returns true when the editor should be updated.
	 *
	 * @private
	 * @param {Object} nextProps React's properties.
	 * @returns {Boolean}
	 */
	_shouldUpdateEditor( nextProps ) {
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

	/**
	 * Returns the editor configuration.
	 *
	 * @private
	 * @return {Object}
	 */
	_getConfig() {
		if ( this.props.data && this.props.config.initialData ) {
			console.warn(
				'Editor data should be provided either using `config.initialData` or `data` properties. ' +
				'The config property is over the data value and the first one will be used when specified both.'
			);
		}

		// Merge two possible ways of providing data into the `config.initialData` field.
		return {
			...this.props.config,
			initialData: this.props.config.initialData || this.props.data || ''
		};
	}
}

/**
 * An adapter aligning the context watchdog API to the editor watchdog API for easier usage.
 */
class EditorWatchdogAdapter {
	/**
	 * @param {ContextWatchdog} contextWatchdog The context watchdog instance that will be wrapped into wditor watchdog API.
	 */
	constructor( contextWatchdog ) {
		this._contextWatchdog = contextWatchdog;

		/**
		 * A unique id for the adapter to distinguish editor items when using the context watchdog API.
		 *
		 * @type {String}
		 */
		this._id = uid();
	}

	/**
	 *  @param {Function} creator A watchdog's editor creator function.
	 */
	setCreator( creator ) {
		this._creator = creator;
	}

	/**
	 * Adds an editor configuration to the context watchdog registry. Creates an instance of it.
	 *
	 * @param {HTMLElement|string} sourceElementOrData A source element or data for the new editor.
	 * @param {Object} config CKEditor 5 editor config.
	 * @returns {Promise}
	 */
	create( sourceElementOrData, config ) {
		return this._contextWatchdog.add( {
			sourceElementOrData,
			config,
			creator: this._creator,
			id: this._id,
			type: 'editor'
		} );
	}

	/**
	 * Creates a listener that is attached to context watchdog's item and run when the context watchdog fires.
	 * Currently works only for the `error` event.
	 *
	 * @param {String} _
	 * @param {Function} callback
	 */
	on( _, callback ) {
		// Assume that the event name was error.
		this._contextWatchdog.on( 'itemError', ( _, { itemId, causesRestart, error } ) => {
			if ( itemId === this._id ) {
				callback( null, { error, causesRestart } );
			}
		} );
	}

	/**
	 * Removes the editor from registered editors and destroys it.
	 */
	destroy() {
		this._contextWatchdog.remove( this._id );
	}

	/**
	 * An editor instance.
	 */
	get editor() {
		return this._contextWatchdog.getItem( this._id );
	}
}

CKEditor.contextType = ContextWatchdogContext;

// Properties definition.
CKEditor.propTypes = {
	editor: PropTypes.func.isRequired,
	data: PropTypes.string,
	config: PropTypes.object,
	onChange: PropTypes.func,
	onReady: PropTypes.func,
	onFocus: PropTypes.func,
	onBlur: PropTypes.func,
	onError: PropTypes.func,
	disabled: PropTypes.bool,
	onInit: ( props, propName ) => {
		if ( props[ propName ] ) {
			return new Error(
				'The "onInit" property is not supported anymore by the CKEditor component. Use the "onReady" property instead.'
			);
		}
	}
};

// Default values for non-required properties.
CKEditor.defaultProps = {
	config: {},
	onError: ( error, details ) => console.error( error, details )
};

// Store the API in the static property to easily overwrite it in tests.
// Too bad dependency injection does not work in Webpack + ES 6 (const) + Babel.
CKEditor._EditorWatchdog = EditorWatchdog;
