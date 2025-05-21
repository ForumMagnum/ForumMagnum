import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import LiveRange from '@ckeditor/ckeditor5-engine/src/model/liverange';
import LivePosition from '@ckeditor/ckeditor5-engine/src/model/liveposition';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';
import type { Editor } from '@ckeditor/ckeditor5-core';

import { defaultConfig, extractDelimiters, hasDelimiters, delimitersCounts } from './utils';
import type MathCommand from './mathcommand';

export default class AutoMath extends Plugin {
	_timeoutId: number|null
	_positionToInsert: LivePosition|null

	static get requires() {
		return [ Clipboard, Undo ];
	}

	static get pluginName() {
		return 'AutoMath';
	}

	constructor( editor: Editor ) {
		super( editor );

		this._timeoutId = null;

		this._positionToInsert = null;
	}

	init() {
		const editor = this.editor;
		const modelDocument = editor.model.document;

		this.listenTo( editor.plugins.get( Clipboard ), 'inputTransformation', () => {
			const firstRange = modelDocument.selection.getFirstRange();

			const leftLivePosition = LivePosition.fromPosition( firstRange.start );
			leftLivePosition.stickiness = 'toPrevious';

			const rightLivePosition = LivePosition.fromPosition( firstRange.end );
			rightLivePosition.stickiness = 'toNext';

			modelDocument.once( 'change:data', () => {
				this._mathBetweenPositions( leftLivePosition, rightLivePosition );

				leftLivePosition.detach();
				rightLivePosition.detach();
			}, { priority: 'high' } );
		} );

		editor.commands.get( 'undo' ).on( 'execute', () => {
			if ( this._timeoutId ) {
				global.window.clearTimeout( this._timeoutId );
				this._positionToInsert.detach();

				this._timeoutId = null;
				this._positionToInsert = null;
			}
		}, { priority: 'high' } );
	}

	_mathBetweenPositions(leftPosition: LivePosition, rightPosition: LivePosition) {
		const editor = this.editor;

		const mathConfig = Object.assign( defaultConfig, this.editor.config.get( 'math' ) );

		const equationRange = new LiveRange( leftPosition, rightPosition );
		const walker = equationRange.getWalker( { ignoreElementEnd: true } );

		let text = '';

		// Get equation text
		for ( const node of walker ) {
			if ( node.item.is( '$textProxy' ) ) {
				text += node.item.data;
			}
		}

		text = text.trim();

		// Skip if don't have delimiters
		if ( !hasDelimiters( text ) || delimitersCounts( text ) !== 2 ) {
			return;
		}

		const mathCommand = editor.commands.get( 'math' );

		// Do not anything if math element cannot be inserted at the current position
		if ( !mathCommand.isEnabled ) {
			return;
		}

		this._positionToInsert = LivePosition.fromPosition( leftPosition );

		// With timeout user can undo conversation if want use plain text
		this._timeoutId = global.window.setTimeout( () => {
			editor.model.change( writer => {
				this._timeoutId = null;

				writer.remove( equationRange );

				let insertPosition: LivePosition|null = null;

				// Check if position where the math element should be inserted is still valid.
				if ( this._positionToInsert.root.rootName !== '$graveyard' ) {
					insertPosition = this._positionToInsert;
				}

				editor.model.change( writer => {
					const params = Object.assign( extractDelimiters( text ), {
						type: mathConfig.outputType
					} );
					const mathElement = writer.createElement(params.display ? 'mathtex-display' : 'mathtex', params );

					editor.model.insertContent( mathElement, insertPosition );

					writer.setSelection( mathElement, 'after' );
				} );

				this._positionToInsert.detach();
				this._positionToInsert = null;
			} );
		}, 100 );
	}
}
