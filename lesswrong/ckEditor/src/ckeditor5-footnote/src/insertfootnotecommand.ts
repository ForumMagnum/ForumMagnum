import Command from '@ckeditor/ckeditor5-core/src/command';
import type ModelWriter from '@ckeditor/ckeditor5-engine/src/model/writer';
import type RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';
import type ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import { modelQueryElement } from './utils';
import { ATTRIBUTES, ELEMENTS } from './constants';

export default class InsertFootnoteCommand extends Command {
	/**
	 * Creates a footnote reference with the given index, and creates a matching
	 * footnote if one doesn't already exist. Also creates the footnote section
	 * if it doesn't exist. If `footnoteIndex` is 0 (or not provided), the added
	 * footnote is given the next unused index--e.g. 7, if 6 footnotes exist so far.
	 */
	execute({footnoteIndex}: {footnoteIndex?: number} = {footnoteIndex: 0}) {
		this.editor.model.enqueueChange(modelWriter => {
			const doc = this.editor.model.document;
			const rootElement = doc.getRoot();
			if (!rootElement) {
				return;
			}
			const footnoteSection = this._getFootnoteSection(modelWriter, rootElement);
			let index: string|undefined = undefined;
			let id: string|undefined = undefined;
			if(footnoteIndex === 0) {
				index = `${footnoteSection.maxOffset + 1}`;
				id = Math.random().toString(36).slice(2);
			} else {
				index = `${footnoteIndex}`;
				const matchingFootnote = modelQueryElement(this.editor, footnoteSection, element =>
					element.is('element', ELEMENTS.footnoteItem) &&
					element.getAttribute(ATTRIBUTES.footnoteIndex) === index
				);
				if (matchingFootnote) {
					id = matchingFootnote.getAttribute(ATTRIBUTES.footnoteId) as string;
				}
			}
			if(!id || !index) {
				return;
			}
			modelWriter.setSelection(doc.selection.getLastPosition());
			const footnoteReference = modelWriter.createElement(ELEMENTS.footnoteReference, { [ATTRIBUTES.footnoteId]: id, [ATTRIBUTES.footnoteIndex]: index });
			this.editor.model.insertContent(footnoteReference);
			modelWriter.setSelection(footnoteReference, 'after');
			// if referencing an existing footnote
			if (footnoteIndex !== 0) {
				return;
			}

			const footnoteContent = modelWriter.createElement(ELEMENTS.footnoteContent);
			const footnoteItem = modelWriter.createElement(ELEMENTS.footnoteItem, { [ATTRIBUTES.footnoteId]: id, [ATTRIBUTES.footnoteIndex]: index });
			const footnoteBackLink = modelWriter.createElement(ELEMENTS.footnoteBackLink, { [ATTRIBUTES.footnoteId]: id });
			const p = modelWriter.createElement('paragraph');
			modelWriter.append(p, footnoteContent);
			modelWriter.append(footnoteContent, footnoteItem);
			modelWriter.insert(footnoteBackLink, footnoteItem, 0);

			this.editor.model.insertContent(footnoteItem, modelWriter.createPositionAt(footnoteSection, footnoteSection.maxOffset));
		});
	}

	/**
	 * Called automatically when changes are applied to the document. Sets `isEnabled`
	 * to determine whether footnote creation is allowed at the current location.
	 */
	refresh() {
		const model = this.editor.model;
		const lastPosition = model.document.selection.getLastPosition();
		const allowedIn = lastPosition && model.schema.findAllowedParent(lastPosition, ELEMENTS.footnoteSection);
		this.isEnabled = allowedIn !== null;
	}

	/**
	 * Returns the footnote section if it exists, or creates on if it doesn't.
	 */
	_getFootnoteSection(writer: ModelWriter, rootElement: RootElement): ModelElement {
		const footnoteSection = modelQueryElement(this.editor, rootElement, element =>  element.is('element', ELEMENTS.footnoteSection));
		if(footnoteSection) {
			return footnoteSection;
		}
		const newFootnoteSection = writer.createElement(
			ELEMENTS.footnoteSection,
		);
		this.editor.model.insertContent(newFootnoteSection, writer.createPositionAt(rootElement, rootElement.maxOffset));
		return newFootnoteSection;
	}
}
