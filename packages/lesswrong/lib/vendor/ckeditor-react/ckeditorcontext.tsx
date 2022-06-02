/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContextWatchdog from '@ckeditor/ckeditor5-watchdog/src/contextwatchdog';

export const ContextWatchdogContext = React.createContext( 'contextWatchdog' );

export default class CKEditorContext extends React.Component {
	constructor( props, context ) {
		super( props, context );

		this.contextWatchdog = null;

		if ( this.props.isLayoutReady ) {
			this._initializeContextWatchdog( this.props.config );
		}
	}

	async shouldComponentUpdate( nextProps ) {
		// If the configuration changes then the ContextWatchdog needs to be destroyed and recreated
		// On top of the new configuration.
		if ( nextProps.id !== this.props.id ) {
			/* istanbul ignore else */
			if ( this.contextWatchdog ) {
				await this.contextWatchdog.destroy();
			}

			await this._initializeContextWatchdog( nextProps.config );
		}

		if ( nextProps.isLayoutReady && !this.contextWatchdog ) {
			await this._initializeContextWatchdog( nextProps.config );

			return true;
		}

		// Rerender the component only when children has changed.
		return this.props.children !== nextProps.children;
	}

	render() {
		return (
			<ContextWatchdogContext.Provider value={ this.contextWatchdog } >
				{ this.props.children }
			</ContextWatchdogContext.Provider>
		);
	}

	async componentWillUnmount() {
		await this._destroyContext();
	}

	async _initializeContextWatchdog( config ) {
		this.contextWatchdog = new ContextWatchdog( this.props.context );

		this.contextWatchdog.on( 'error', ( _, errorEvent ) => {
			this.props.onError( errorEvent.error, {
				phase: 'runtime',
				willContextRestart: errorEvent.causesRestart
			} );
		} );

		this.contextWatchdog.on( 'stateChange', () => {
			if ( this.contextWatchdog.state === 'ready' && this.props.onReady ) {
				this.props.onReady( this.contextWatchdog.context );
			}
		} );

		await this.contextWatchdog.create( config )
			.catch( error => {
				this.props.onError( error, {
					phase: 'initialization',
					willContextRestart: false
				} );
			} );
	}

	async _destroyContext() {
		if ( this.contextWatchdog ) {
			await this.contextWatchdog.destroy();
			this.contextWatchdog = null;
		}
	}
}

CKEditorContext.defaultProps = {
	isLayoutReady: true,
	onError: ( error, details ) => console.error( error, details )
};

// Properties definition.
CKEditorContext.propTypes = {
	id: PropTypes.string,
	isLayoutReady: PropTypes.bool,
	context: PropTypes.func,
	config: PropTypes.object,
	onReady: PropTypes.func,
	onError: PropTypes.func
};

