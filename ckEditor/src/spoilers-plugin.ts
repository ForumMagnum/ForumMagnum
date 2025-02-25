/* eslint-disable no-tabs */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import blockAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/blockautoformatediting';
import first from '@ckeditor/ckeditor5-utils/src/first';
import type { Element } from '@ckeditor/ckeditor5-engine';
import type Writer from '@ckeditor/ckeditor5-engine/src/model/writer';
import type Schema from '@ckeditor/ckeditor5-engine/src/model/schema';

type SpoilerBlockCommandOptions = {
	/**
	 * If set, it will force the command behavior. If `true`, the command will apply a block quote,
	 * otherwise the command will remove the block quote. If not set, the command will act basing on its current value.
	*/
	forceValue?: boolean
}

export default class Spoilers extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	static get pluginName() {
		return 'Spoilers';
	}

	init() {
		this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'spoiler', new SpoilerBlockCommand( this.editor ) );
    }

    afterInit(){
        this._addCodeBlockAutoformats();
        const editor = this.editor;
		const command = editor.commands.get( 'spoiler' );

		// Overwrite default Enter key behavior.
		// If Enter key is pressed with selection collapsed in empty block inside a quote, break the quote.
		// This listener is added in afterInit in order to register it after list's feature listener.
		// We can't use a priority for this, because 'low' is already used by the enter feature, unless
		// we'd use numeric priority in this case.
		this.listenTo( this.editor.editing.view.document, 'enter', ( evt, data ) => {
			const doc = this.editor.model.document;
			const positionParent = doc.selection.getLastPosition().parent;

			if ( doc.selection.isCollapsed && positionParent.isEmpty && command.value ) {
				this.editor.execute( 'spoiler' );
				this.editor.editing.view.scrollToTheSelection();

				data.preventDefault();
				evt.stop();
			}
		} );
    }    
   
	/**
	 * Adds autoformatting related to {@link module:code-block/codeblock~CodeBlock}.
	 *
	 * When typed:
	 * - `` ``` `` &ndash; A paragraph will be changed to a code block.
	 *
	 * @private
	 */
	_addCodeBlockAutoformats() {
		if ( this.editor.commands.get( 'spoiler' ) ) {
			blockAutoformatEditing( this.editor, this as AnyBecauseTodo, /^>!$/, 'spoiler' );
		}
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'spoiler', {
            allowWhere: '$block',
            allowContentOf: '$root'
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;
		conversion.for( 'upcast' ).elementToElement( {
            model: 'spoiler',
            view: {
                name: 'div',
                classes: 'spoilers'
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'spoiler',
            view: {
                name: 'div',
                classes: 'spoilers'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'spoiler',
            view: ( modelElement, { writer: viewWriter } ) => {
                // Note: You use a more specialized createEditableElement() method here.
                const div = viewWriter.createEditableElement( 'div', { class: 'spoilers' } );

                return toWidgetEditable( div, viewWriter );
            }
        } );
	}
}


// Based on @ckeditor/ckeditor5-block-quote/src/blockquote/src/blockquotecommand
class SpoilerBlockCommand extends Command {
	/**
	 * Whether the selection starts in a block quote.
	 *
	 * @observable
	 * @readonly
	 * @member {Boolean} #value
	 */

	/**
	 * @inheritDoc
	 */
	refresh() {
		this.value = this._getValue();
		this.isEnabled = this._checkEnabled();
	}

	/**
	 * Executes the command. When the command {@link #value is on}, all top-most block quotes within
	 * the selection will be removed. If it is off, all selected blocks will be wrapped with
	 * a block quote.
	 *
	 * @fires execute
	 */
	execute( options: SpoilerBlockCommandOptions = {} ) {
		const model = this.editor.model;
		const schema = model.schema;
		const selection = model.document.selection;

		const blocks = Array.from( selection.getSelectedBlocks() );

		const value = ( options.forceValue === undefined ) ? !this.value : options.forceValue;

		model.change( writer => {
			if ( !value ) {
				this._removeSpoiler( writer, blocks.filter( findSpoiler ) );
			} else {
				const blocksToSpoiler = blocks.filter( block => {
					// Already quoted blocks needs to be considered while quoting too
					// in order to reuse their <bQ> elements.
					return findSpoiler( block ) || checkCanBeSpoiler( schema, block );
				} );

				this._applySpoiler( writer, blocksToSpoiler );
			}
		} );
	}

	/**
	 * Checks the command's {@link #value}.
	 *
	 * @private
	 */
	_getValue(): boolean {
		const selection = this.editor.model.document.selection;

		const firstBlock = first( selection.getSelectedBlocks() );

		// In the current implementation, the block quote must be an immediate parent of a block element.
		return !!( firstBlock && findSpoiler( firstBlock ) );
	}

	/**
	 * Checks whether the command can be enabled in the current context.
	 *
	 * @private
	 */
	_checkEnabled(): boolean {
		if ( this.value ) {
			return true;
		}

		const selection = this.editor.model.document.selection;
		const schema = this.editor.model.schema;

		const firstBlock = first( selection.getSelectedBlocks() );

		if ( !firstBlock ) {
			return false;
		}

		return checkCanBeSpoiler( schema, firstBlock );
	}

	/**
	 * Removes the quote from given blocks.
	 *
	 * If blocks which are supposed to be "unquoted" are in the middle of a quote,
	 * start it or end it, then the quote will be split (if needed) and the blocks
	 * will be moved out of it, so other quoted blocks remained quoted.
	 *
	 * @private
	 * @param {module:engine/model/writer~Writer} writer
	 */
	_removeSpoiler(writer: Writer, blocks: Element[]) {
		// Unquote all groups of block. Iterate in the reverse order to not break following ranges.
		getRangesOfBlockGroups( writer, blocks ).reverse().forEach( (groupRange: AnyBecauseTodo) => {
			if ( groupRange.start.isAtStart && groupRange.end.isAtEnd ) {
				writer.unwrap( groupRange.start.parent );

				return;
			}

			// The group of blocks are at the beginning of an <bQ> so let's move them left (out of the <bQ>).
			if ( groupRange.start.isAtStart ) {
				const positionBefore = writer.createPositionBefore( groupRange.start.parent );

				writer.move( groupRange, positionBefore );

				return;
			}

			// The blocks are in the middle of an <bQ> so we need to split the <bQ> after the last block
			// so we move the items there.
			if ( !groupRange.end.isAtEnd ) {
				writer.split( groupRange.end );
			}

			// Now we are sure that groupRange.end.isAtEnd is true, so let's move the blocks right.

			const positionAfter = writer.createPositionAfter( groupRange.end.parent );

			writer.move( groupRange, positionAfter );
		} );
	}

	/**
	 * Applies the quote to given blocks.
	 *
	 * @private
	 * @param {module:engine/model/writer~Writer} writer
	 * @param {Array.<module:engine/model/element~Element>} blocks
	 */
	_applySpoiler(writer: Writer, blocks: Element[]) {
		const spoilersToMerge: AnyBecauseTodo[] = [];

		// Quote all groups of block. Iterate in the reverse order to not break following ranges.
		getRangesOfBlockGroups( writer, blocks ).reverse().forEach( groupRange => {
			let spoiler = findSpoiler( groupRange.start );

			if ( !spoiler ) {
				spoiler = writer.createElement( 'spoiler' );

				writer.wrap( groupRange, spoiler );
			}

			spoilersToMerge.push( spoiler );
		} );

		// Merge subsequent <bQ> elements. Reverse the order again because this time we want to go through
		// the <bQ> elements in the source order (due to how merge works – it moves the right element's content
		// to the first element and removes the right one. Since we may need to merge a couple of subsequent `<bQ>` elements
		// we want to keep the reference to the first (furthest left) one.
		spoilersToMerge.reverse().reduce( ( current, next ) => {
			if ( current.nextSibling == next ) {
				writer.merge( writer.createPositionAfter( current ) );

				return current;
			}

			return next;
		} );
	}
}

function findSpoiler( elementOrPosition: AnyBecauseTodo ) {
	return elementOrPosition.parent.name == 'spoiler' ? elementOrPosition.parent : null;
}

// Returns a minimal array of ranges containing groups of subsequent blocks.
//
// content:         abcdefgh
// blocks:          [ a, b, d, f, g, h ]
// output ranges:   [ab]c[d]e[fgh]
//
// @param {Array.<module:engine/model/element~Element>} blocks
// @returns {Array.<module:engine/model/range~Range>}
function getRangesOfBlockGroups(writer: Writer, blocks: Element[]) {
	let startPosition;
	let i = 0;
	const ranges = [];

	while ( i < blocks.length ) {
		const block = blocks[ i ];
		const nextBlock = blocks[ i + 1 ];

		if ( !startPosition ) {
			startPosition = writer.createPositionBefore( block );
		}

		if ( !nextBlock || block.nextSibling != nextBlock ) {
			ranges.push( writer.createRange( startPosition, writer.createPositionAfter( block ) ) );
			startPosition = null;
		}

		i++;
	}

	return ranges;
}

// Checks whether <bQ> can wrap the block.
function checkCanBeSpoiler( schema: Schema, block: AnyBecauseTodo ) {
	// TMP will be replaced with schema.checkWrap().
	const isBQAllowed = schema.checkChild( block.parent, 'spoiler' );
	const isBlockAllowedInBQ = schema.checkChild( [ '$root', 'spoiler' ], block );

	return isBQAllowed && isBlockAllowedInBQ;
}
