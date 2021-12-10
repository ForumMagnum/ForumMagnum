// @ts-check (uses JSDoc types for type checking)

/**
 * CKEditor dataview nodes can be converted to a output view or an editor view via downcasting
 *  * Upcasting is converting to the platonic ckeditor version.
 *  * Downcasting is converting to the output version.
 */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import InsertFootnoteCommand from '../insertfootnotecommand';
import '../../theme/placeholder.css';
import '../../theme/footnote.css';
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';
import { modelQueryElement, modelQueryElementsAll } from '../utils';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';

import { defineSchema } from './schema';
import { defineConverters } from './converters';
import { addFootnoteAutoformatting } from './autoformatting';
import { ATTRIBUTES, COMMANDS, ELEMENTS } from '../constants';

export default class FootnoteEditing extends Plugin {
	static get requires() {
		return [ Widget, Autoformat ];
	}

	/**
	 * @type {RootElement} The root element of the document.
	 */
	get rootElement() {
		const rootElement = this.editor.model.document.getRoot();
		if(!rootElement) {
			throw new Error('Document has no rootElement element.')
		}
		return rootElement;
	}

	init() {
		defineSchema(this.editor.model.schema);
		defineConverters(this.editor, this.rootElement);

		this.editor.commands.add( COMMANDS.insertFootnote, new InsertFootnoteCommand( this.editor ) );

		addFootnoteAutoformatting(this.editor, this.rootElement);

		this._handleDelete();

		// The following callbacks are needed to map nonempty view elements
		// to empty model elements. See https://ckeditor.com/docs/ckeditor5/latest/api/module_widget_utils.html#function-viewToModelPositionOutsideModelElement
		this.editor.editing.mapper.on(
			'viewToModelPosition',
			// @ts-ignore -- the type signature of `on` here seem to be just wrong, given how it's used in the source code. 
			viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasAttribute( ATTRIBUTES.footnoteReference ) )
		);
	}

	/**
	 * This method broadly deals with deletion of text and elements, and updating the model
	 * accordingly. There are three cases handled:
	 * 1. If the footnote section gets deleted, remove all footnote references.
	 * 2. If a delete operation happens in an empty footnote, delete the footnote.
	 * 3. If the entire contents of a nonempty footnote are deleted, delete the contents
	 *    without deleting the footnote (without this CKEditor deletes the parent element automatically,
	 *    which feels). In practice, this means leaving one empty paragrpah.
	 */
	_handleDelete() {
		const viewDocument = this.editor.editing.view.document;
		const editor = this.editor;
		this.listenTo( viewDocument, 'delete', (evt, data) => {
			const doc = editor.model.document;
			const deletedElement = doc.selection.getSelectedElement();
			const selectionEndPos = doc.selection.getLastPosition();
			const selectionStartPos = doc.selection.getFirstPosition();
			if(!selectionEndPos || !selectionStartPos) {
				throw new Error('Selection must have at least one range to perform delete operation.');
			}

			// delete all footnote references if footnote section gets deleted
			if (deletedElement && deletedElement.name === ELEMENTS.footnoteSection) {
				this._removeReferences();
			}

			const deletingFootnote = deletedElement && deletedElement.name === ELEMENTS.footnoteItem

			const currentFootnote = deletingFootnote ? 
				deletedElement :
				selectionEndPos.findAncestor(ELEMENTS.footnoteItem);
			if(!currentFootnote) {
				return;
			}

			const endParagraph = selectionEndPos.findAncestor('paragraph');
			const startParagraph = selectionStartPos.findAncestor('paragraph');
			const currentFootnoteContent = selectionEndPos.findAncestor(ELEMENTS.footnoteContent);
			if(!currentFootnoteContent || !startParagraph || !endParagraph) {
				return;
			}

			const footnoteIsEmpty = startParagraph .maxOffset === 0 && currentFootnoteContent.childCount === 1;

			if(deletingFootnote || footnoteIsEmpty) {
				this._removeFootnote(currentFootnote);
				data.preventDefault();
				evt.stop();
				return;
			}

			const entireContentsSelected = 
				selectionStartPos.isAtStart && startParagraph.index === 0 &&
				selectionEndPos.isAtEnd && endParagraph.endOffset === currentFootnoteContent.maxOffset;

			if(entireContentsSelected) {
				this._clearContents(currentFootnoteContent);
				data.preventDefault();
				evt.stop();
			}
		}, { priority: 'high' });
	}

	/**
	 * Clear the children of the provided footnoteContent element, 
	 * leaving an empty paragraph behind. This allows users to empty
	 * a footnote without deleting it.
	 * @param {ModelElement} footnoteContent 
	 */
	_clearContents(footnoteContent) {
		this.editor.model.enqueueChange(writer => {
			const contents = writer.createRangeIn(footnoteContent);
			writer.appendElement("paragraph", footnoteContent);
			writer.remove(contents);
		})
	}

	/**
	 * Removes a footnote and its references, and renumbers subsequent footnotes. When a footnote's
	 * number changes, it's references automatically update from a dispatcher event in converters.js, 
	 * which triggers the `updateReferences` method.
	 * @param {ModelElement} footnote 
	 */
	_removeFootnote(footnote) {
		// delete the current footnote and its references,
		// and renumber subsequent footnotes.
		if(!this.editor) {
			return;
		}
		const footnoteSection = footnote.findAncestor(ELEMENTS.footnoteSection);
		
		if(!footnoteSection) {
			this.editor.model.enqueueChange(writer => {
				writer.remove(footnote);
			});
			return;
		}
		const index = footnoteSection.getChildIndex(footnote);
		this._removeReferences(index+1);

		let footnoteSectionRemoved = false;
		this.editor.model.enqueueChange(writer => {
			writer.remove(footnote);
			// if only one footnote remains, remove the footnote section
			if(footnoteSection.maxOffset === 0) {
				writer.remove(footnoteSection);
				this._removeReferences();
			} else {
				// after footnote deletion the selection winds up surrounding the previous footnote
				// (or the following footnote if no previous footnote exists). Typing in that state
				// immediately deletes the footnote. This deliberately sets the new selection position
				// to avoid that.
				const neighborFootnote = index === 0 ? 
					footnoteSection.getChild(index) : 
					footnoteSection.getChild(index-1);
				if(!(neighborFootnote instanceof ModelElement)) {
					return;
				}

				const neighborEndParagraph = modelQueryElementsAll(
					this.editor, 
					neighborFootnote, 
					element =>  element.name === 'paragraph'
				).pop();

				neighborEndParagraph && writer.setSelection(neighborEndParagraph, 'end');
			}
		} );

		// renumber subsequent footnotes
		const subsequentFootnotes = [...footnoteSection.getChildren()].slice(index);
		for (const [i, child] of subsequentFootnotes.entries()) {
			if(!(child instanceof ModelElement)) {
				continue;
			}
			this.editor.model.enqueueChange(writer => {
				writer.setAttribute( ATTRIBUTES.footnoteId, index+i+1, child);
			} );
		}
	}

	/**
	 * Deletes all references to the footnote with the given id. If an id of 0 is provided,
	 * all references are deleted.
	 * @param {number} footnoteId
	 */
	_removeReferences(footnoteId=0) {
		const removeList = [];
		if(!this.rootElement) throw new Error('Document has no root element.');
		const footnoteReferences = modelQueryElementsAll(this.editor, this.rootElement, e => e.name === ELEMENTS.footnoteReference);
		footnoteReferences.forEach((footnoteReference) => {
			const id = footnoteReference.getAttribute(ATTRIBUTES.footnoteId);
			const idAsInt = parseInt(id ? id : '');
			if (idAsInt === footnoteId || footnoteId === 0) {
				removeList.push(footnoteReference);
			}
		});
		for (const item of removeList) {
			this.editor.model.change( writer => {
				writer.remove( item );
			} );
		}
	}
}
