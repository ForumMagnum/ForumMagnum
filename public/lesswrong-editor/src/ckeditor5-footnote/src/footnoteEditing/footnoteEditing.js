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
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
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

		this._deleteModify();

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

	_deleteModify() {
		const viewDocument = this.editor.editing.view.document;
		const editor = this.editor;
		this.listenTo( viewDocument, 'delete', (evt, data) => {
			const doc = editor.model.document;
			const deleteEle = doc.selection.getSelectedElement();
			const lastPosition = doc.selection.getLastPosition();
			if(!doc.selection.anchor || 
				!doc.selection.focus || 
				!lastPosition) {
				throw new Error('Selection must have at least one range to perform delete operation.');
			}
			const positionParent = lastPosition.parent;
		
			// delete all footnoteReference references if footnotes section gets deleted
			if (deleteEle !== null && deleteEle.name === ELEMENTS.footnoteSection) {
				this._removeHolder(0);
			}

			if (!positionParent || positionParent.parent instanceof DocumentFragment || !positionParent.parent || positionParent.parent.name !== ELEMENTS.footnoteList) {
				return;
			}

			// don't allow deleting a nonempty footnote without deleting text
			if (positionParent.maxOffset > 1 && doc.selection.anchor.offset <= 1) {
				data.preventDefault();
				evt.stop();
			}

			const entireParagraphSelected = (positionParent.maxOffset === doc.selection.anchor.offset && doc.selection.focus.offset === 0) ||
				(positionParent.maxOffset === doc.selection.focus.offset && doc.selection.anchor.offset === 0);

			if(entireParagraphSelected && positionParent.index) {
				editor.model.change(writer => {
					writer.remove(positionParent);
				});
				return;
			}

			if ((doc.selection.anchor.offset === 0 && positionParent.maxOffset === 1) || entireParagraphSelected) {
				const footnoteList = positionParent.parent;
				const index = footnoteList.index;
				const footnoteSection = footnoteList.parent;
				if (
					index === null || 
					!footnoteSection || 
					!(footnoteSection instanceof ModelElement)) 
				throw new Error("footnoteList has an invalid parent section.")

				this._removeHolder(index+1);
				editor.model.change(writer => {
					writer.remove(footnoteList);
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
	_removeHolder(footnoteId) {
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
