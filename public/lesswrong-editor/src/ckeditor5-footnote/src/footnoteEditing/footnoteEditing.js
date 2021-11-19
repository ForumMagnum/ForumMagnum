// @ts-check
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
import DocumentFragment from '@ckeditor/ckeditor5-engine/src/model/documentfragment';
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
			viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasAttribute( ATTRIBUTES.footnoteItem ) )
		);
	}

	/**
	 * This method broadly deals with deletion of text, and updating the model
	 * accordingly.
	 * 1. If the footer footnotes section is deleted, all footnote references are removed.
	 * 2. To avoid accidental deletion of content, deleting the number on a footnote while the
	 * footnote still contains text will do nothing.
	 * 3. 
	 */
	_handleDelete() {
		const viewDocument = this.editor.editing.view.document;
		const editor = this.editor;
		this.listenTo( viewDocument, 'delete', (evt, data) => {
			const doc = editor.model.document;
			const deletedElement = doc.selection.getSelectedElement();
			const selectionEndpoint = doc.selection.getLastPosition();
			if(!doc.selection.anchor || 
				!doc.selection.focus || 
				!selectionEndpoint) {
				throw new Error('Selection must have at least one range to perform delete operation.');
			}
		
			// delete all footnote references if footnote section gets deleted
			if (deletedElement !== null && deletedElement.name === ELEMENTS.footnoteSection) {
				this._removeReferences(0);
			}

			// selectionParent is the element containing the selection's endpoint.
			const selectionParent = selectionEndpoint.parent;

			// return unless the current selection is inside a footnoteList element.
			if (!selectionParent || selectionParent.parent instanceof DocumentFragment || !selectionParent.parent || selectionParent.parent.name !== ELEMENTS.footnoteList) {
				return;
			}

			// don't allow deleting a nonempty footnote without deleting text
			if (selectionParent.maxOffset > 1 && doc.selection.anchor.offset <= 1) {
				data.preventDefault();
				evt.stop();
			}

			const entireParagraphSelected = (selectionParent.maxOffset === doc.selection.anchor.offset && doc.selection.focus.offset === 0) ||
				(selectionParent.maxOffset === doc.selection.focus.offset && doc.selection.anchor.offset === 0);

			// If the entire current paragraph is selected, and it's not the
			// first paragraph of the current footnote, simply delete the
			// paragraph.
			if(entireParagraphSelected && selectionParent.index) {
				editor.model.change(writer => {
					writer.remove(selectionParent);
				});
				return;
			}

			// if a) the footnote contains no text (other than its number) or b) the entire footnote is selected,
			// remove the footnote and its references.
			if (selectionParent.maxOffset === 1 || entireParagraphSelected) {
				const footnoteList = selectionParent.parent;
				const index = footnoteList.index;
				const footnoteSection = footnoteList.parent;
				if (
					index === null || 
					!footnoteSection || 
					!(footnoteSection instanceof ModelElement)
				) {
					throw new Error("footnoteList has an invalid parent.")
				}

				this._removeReferences(index+1);
				editor.model.change(writer => {
					writer.remove(footnoteList);
					// if only one footnote remains, remove the footnote section
					if(footnoteSection.maxOffset === 0) {
						writer.remove(footnoteSection);
					}
				} );
				const subsequentFootnotes = [...footnoteSection.getChildren()].slice(index);
				for (const [i, child] of subsequentFootnotes.entries()) {
					if(!(child instanceof ModelElement)) {
						continue;
					}
					editor.model.enqueueChange(writer => {
						const footnoteItem = modelQueryElement(this.editor, child, element =>  element.name === ELEMENTS.footnoteItem);
						if(!footnoteItem) {
							return;
						}
						writer.setAttribute( ATTRIBUTES.footnoteId, index+i+1, footnoteItem);
					} );
				}
				data.preventDefault();
				evt.stop();
			}
		} , { priority: 'high' });
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
