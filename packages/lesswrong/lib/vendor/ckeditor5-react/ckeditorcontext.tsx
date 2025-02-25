/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 *
 * Vendored from https://github.com/ckeditor/ckeditor5-react
 * commit 93d7c69b64a5d13dcac79a17794dc278f4d06fb7
 */
/* eslint-disable no-tabs */

import React, { ReactNode } from 'react';
import PropTypes, { InferProps, Validator } from 'prop-types';

import { default as ContextWatchdog } from '../ckeditor5-watchdog/contextwatchdog';
import type { WatchdogConfig } from '../ckeditor5-watchdog/watchdog';

import type { Context, ContextConfig } from '@ckeditor/ckeditor5-core';

export const ContextWatchdogContext = React.createContext<ContextWatchdog | 'contextWatchdog' | null>( 'contextWatchdog' );

// eslint-disable-next-line @typescript-eslint/ban-types
export default class CKEditorContext<TContext extends Context = Context> extends React.Component<Props<TContext>, {}> {
	public contextWatchdog: ContextWatchdog<TContext> | null = null;

	constructor( props: Props<TContext>, context: any ) {
		super( props, context );

		if ( this.props.isLayoutReady ) {
			void this._initializeContextWatchdog( this.props.config );
		}
	}

	public override shouldComponentUpdate( nextProps: Readonly<Props<TContext> & { children?: ReactNode | undefined }> ): boolean {
		return this._shouldComponentUpdate( nextProps ) as unknown as boolean;
	}

	/**
	 * Wrapper for the async handler. Note that this is an implementation bug, see https://github.com/ckeditor/ckeditor5-react/issues/312.
	 */
	private async _shouldComponentUpdate( nextProps: Readonly<Props<TContext> & { children?: ReactNode | undefined }> ): Promise<boolean> {
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

	public override render(): ReactNode {
		return (
			<ContextWatchdogContext.Provider value={ this.contextWatchdog }>
				{ this.props.children }
			</ContextWatchdogContext.Provider>
		);
	}

	public override componentWillUnmount(): void {
		void this._destroyContext();
	}

	private async _initializeContextWatchdog( config?: ContextConfig ): Promise<void> {
		this.contextWatchdog = new ContextWatchdog( this.props.context!, this.props.watchdogConfig );

		this.contextWatchdog.on( 'error', ( _, errorEvent ) => {
			this.props.onError( errorEvent.error, {
				phase: 'runtime',
				willContextRestart: errorEvent.causesRestart
			} );
		} );

		this.contextWatchdog.on( 'stateChange', () => {
			if ( this.contextWatchdog!.state === 'ready' && this.props.onReady ) {
				this.props.onReady( this.contextWatchdog!.context! );
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

	private async _destroyContext(): Promise<void> {
		if ( this.contextWatchdog ) {
			await this.contextWatchdog.destroy();
			this.contextWatchdog = null;
		}
	}

	public static defaultProps: Partial<Props<Context>> = {
		isLayoutReady: true,
		onError: ( error, details ) => {
			// eslint-disable-next-line no-console
			console.error( error, details )
		},
	};

	public static propTypes = {
		id: PropTypes.string,
		isLayoutReady: PropTypes.bool,
		context: PropTypes.func as unknown as Validator<{ create( ...args: any ): Promise<any> } | undefined>,
		watchdogConfig: PropTypes.object,
		config: PropTypes.object,
		onReady: PropTypes.func,
		onError: PropTypes.func
	};
}

interface Props<TContext extends Context> extends InferProps<typeof CKEditorContext.propTypes> {
	context?: { create( ...args: any ): Promise<TContext> };
	watchdogConfig?: WatchdogConfig;
	config?: ContextConfig;
	onReady?: ( context: Context ) => void; // TODO this should accept TContext (after ContextWatchdog release).
	onError: ( error: Error, details: ErrorDetails ) => void;
	children?: ReactNode;
}

interface ErrorDetails {
	phase: 'initialization' | 'runtime';
	willContextRestart: boolean;
}
