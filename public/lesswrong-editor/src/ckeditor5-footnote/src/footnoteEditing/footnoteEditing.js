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
import { Editor } from '@ckeditor/ckeditor5-core';
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
		this.editor.editing.mapper.on(
			'viewToModelPosition',
			// @ts-ignore
			viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasAttribute( ATTRIBUTES.footnoteLabel ) )
		);
	}

	/**
	 * This method broadly deals with deletion of text and elements, and updating the model
	 * accordingly. 
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
				this._removeReferences(0);
			}

			const deletingFootnote = deletedElement && deletedElement.name === 'footnote'

			const currentFootnote = deletingFootnote ? 
										deletedElement :
										selectionEndPos.findAncestor('footnote');
			if(!currentFootnote) {
				return;
			}
			const currentParagraph = deletedElement && deletedElement.name === 'paragraph' ? 
										deletedElement :
										selectionEndPos.findAncestor('paragraph');
			const footnoteSection = currentFootnote.findAncestor(ELEMENTS.footnoteSection);
			if(deletingFootnote && footnoteSection) { 
				this._removeFootnote(editor, currentFootnote, footnoteSection);
				data.preventDefault();
				evt.stop();
				return;
			}

			const entireParagraphSelected = currentParagraph && selectionStartPos.isAtStart && selectionEndPos.isAtEnd;

			const deletingFirstParagraphOfFootnote = 
				(deletedElement && !deletedElement.index) ||
				(entireParagraphSelected && !currentParagraph.index);

			// if the deleted section isn't a paragraph, or if it isn't the first paragraph
			// of its footnote, let the standard delete operation proceed.
			if(!deletingFirstParagraphOfFootnote || !footnoteSection){
				return;
			}

			this._removeFootnote(editor, currentFootnote, footnoteSection);
			data.preventDefault();
			evt.stop();
		}, { priority: 'high' });
	}

	/**
	 * Removes a footnote and its references, and renumbers subsequent footnotes.
	 * @param {Editor} editor 
	 * @param {ModelElement} footnote 
	 * @param {ModelElement} footnoteSection 
	 */
	_removeFootnote(editor, footnote, footnoteSection) {
		// delete the current footnote and its references,
		// and renumber subsequent footnotes.
		const index = footnoteSection.getChildIndex(footnote);
		this._removeReferences(index+1);

		let footnoteSectionRemoved = false;
		editor.model.enqueueChange(writer => {
			writer.remove(footnote);
			// if only one footnote remains, remove the footnote section
			if(footnoteSection.maxOffset === 0) {
				writer.remove(footnoteSection);
				this._removeReferences(0);
				footnoteSectionRemoved = true;
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
		if(footnoteSectionRemoved) {
			return;
		}

		// renumber subsequent footnotes
		const subsequentFootnotes = [...footnoteSection.getChildren()].slice(index);
		for (const [i, child] of subsequentFootnotes.entries()) {
			if(!(child instanceof ModelElement)) {
				continue;
			}
			editor.model.enqueueChange(writer => {
				const footnoteLabel = modelQueryElement(this.editor, child, element =>  element.name === ELEMENTS.footnoteLabel);
				if(!footnoteLabel) {
					return;
				}
				writer.setAttribute( ATTRIBUTES.footnoteId, index+i+1, footnoteLabel);
			} );
		}
	}

	/**
	 * Deletes all references to the footnote with the given id. If an id of 0 is provided,
	 * all references are deleted.
	 * @param {number} footnoteId
	 */
	_removeReferences(footnoteId) {
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
