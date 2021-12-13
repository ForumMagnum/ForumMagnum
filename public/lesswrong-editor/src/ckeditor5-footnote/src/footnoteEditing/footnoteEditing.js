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
import Batch from '@ckeditor/ckeditor5-engine/src/model/batch';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';
import { modelQueryElementsAll } from '../utils';
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

		this.editor.model.document.on('change:data', (eventInfo, batch) => {
			eventInfo.source.differ.getChanges().forEach(diffItem => {
				if(
					diffItem.type === 'attribute' && 
					diffItem.attributeKey === ATTRIBUTES.footnoteId 
				) {
					const {attributeOldValue: oldFootnoteId, attributeNewValue: newFootnoteId} = diffItem;
					this._updateReferenceIds(batch, oldFootnoteId, newFootnoteId);
				}
			});
		}, { priority: 'high' });
		
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
	 * accordingly. In particular, the following cases are handled:
	 * 1. If the footnote section gets deleted, all footnote references are removed.
	 * 2. If a delete operation happens in an empty footnote, the footnote is deleted.
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

			this.editor.model.enqueueChange( writer => {
				// delete all footnote references if footnote section gets deleted
				if (deletedElement && deletedElement.is('element', ELEMENTS.footnoteSection)) {
					this._removeReferences(writer);
				}

				const deletingFootnote = deletedElement && deletedElement.is('element', ELEMENTS.footnoteItem)

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

				const footnoteIsEmpty = startParagraph.maxOffset === 0 && currentFootnoteContent.childCount === 1;

				if(deletingFootnote || footnoteIsEmpty) {
					this._removeFootnote(writer, currentFootnote);
					data.preventDefault();
					evt.stop();
					return;
				}
			});
		}, { priority: 'high' });
	}

	/**
	 * Clear the children of the provided footnoteContent element, 
	 * leaving an empty paragraph behind. This allows users to empty
	 * a footnote without deleting it.
	 * @param {ModelElement} footnoteContent 
	 */
	_clearContents(writer, footnoteContent) {
		const contents = writer.createRangeIn(footnoteContent);
		writer.appendElement("paragraph", footnoteContent);
		writer.remove(contents);
	}

	/**
	 * Removes a footnote and its references, and renumbers subsequent footnotes. When a footnote's
	 * id attribute changes, it's references automatically update from a dispatcher event in converters.js, 
	 * which triggers the `updateReferences` method.
	 * @param {ModelElement} footnote 
	 */
	_removeFootnote(writer, footnote) {
		// delete the current footnote and its references,
		// and renumber subsequent footnotes.
		if(!this.editor) {
			return;
		}
		const footnoteSection = footnote.findAncestor(ELEMENTS.footnoteSection);
		
		if(!footnoteSection) {
			writer.remove(footnote);
			return;
		}
		const index = footnoteSection.getChildIndex(footnote);
		this._removeReferences(writer, index+1);

		writer.remove(footnote);
		// if no footnotes remain, remove the footnote section
		if(footnoteSection.childCount === 0) {
			writer.remove(footnoteSection);
			this._removeReferences(writer);
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
				element =>  element.is('element', 'paragraph')
			).pop();

			neighborEndParagraph && writer.setSelection(neighborEndParagraph, 'end');
		}

		// renumber subsequent footnotes
		const subsequentFootnotes = [...footnoteSection.getChildren()].slice(index);
		for (const [i, child] of subsequentFootnotes.entries()) {
			writer.setAttribute( ATTRIBUTES.footnoteId, index+i+1, child);
		}
	}

	/**
	 * Deletes all references to the footnote with the given id. If an id of 0 is provided,
	 * all references are deleted.
	 * @param {number} footnoteId
	 */
	_removeReferences(writer, footnoteId=0) {
		const removeList = [];
		if(!this.rootElement) throw new Error('Document has no root element.');
		const footnoteReferences = modelQueryElementsAll(this.editor, this.rootElement, e => e.is('element', ELEMENTS.footnoteReference));
		footnoteReferences.forEach((footnoteReference) => {
			const id = footnoteReference.getAttribute(ATTRIBUTES.footnoteId);
			const idAsInt = parseInt(id ? id : '');
			if (idAsInt === footnoteId || footnoteId === 0) {
				removeList.push(footnoteReference);
			}
		});
		for (const item of removeList) {
			writer.remove( item );
		}
	}

	/**
	 * Updates all references for a single footnote. This function is called when
	 * the id attribute of an existing footnote changes, which happens when a footnote 
	 * with a lower id is deleted, which is handled by `_removeFootnote` in
	 * footnoteEditing.js.
	 * @param {Batch} batch
	 * @param {string} oldFootnoteId
	 * @param {string} newFootnoteId
	 */
	_updateReferenceIds(batch, oldFootnoteId, newFootnoteId) {
		const footnoteReferences = modelQueryElementsAll(
			this.editor, 
			this.rootElement, 
			e => e.is('element', ELEMENTS.footnoteReference) && e.getAttribute(ATTRIBUTES.footnoteId) === oldFootnoteId
		);
		this.editor.model.enqueueChange(batch, writer => {
			footnoteReferences.forEach(footnoteReference => {
				writer.setAttribute(ATTRIBUTES.footnoteId, newFootnoteId, footnoteReference);
			});
		});
	}
}
