import Command from '@ckeditor/ckeditor5-core/src/command';
import { BUTTON_ELEMENT } from './constants';

export default class InsertFootnoteCommand extends Command {
	execute(attributes) {
		this.editor.model.enqueueChange(modelWriter => {
			console.log('attributes', attributes)
			const button = modelWriter.createElement(BUTTON_ELEMENT, {
				'data-href': attributes.link || '',
				'data-text': attributes.text || 'Apply now'
			});
			// modelWriter.createText(attributes.text ?? 'Apply now');
			console.log('button', button)
			this.editor.model.insertContent(button);
		});
	}

	/**
	 * Called automatically when changes are applied to the document. Sets `isEnabled`
	 * to determine whether footnote creation is allowed at the current location.
	 */
	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), BUTTON_ELEMENT );

		this.isEnabled = allowedIn !== null;
	}

}
