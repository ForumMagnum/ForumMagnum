import Command from '@ckeditor/ckeditor5-core/src/command';
import { BUTTON_ELEMENT } from './constants';

export default class InsertFootnoteCommand extends Command {
	execute() {
		this.editor.model.enqueueChange(modelWriter => {
			const button = modelWriter.createElement(BUTTON_ELEMENT);
			this.editor.model.insertContent(button);
		});
	}

	/**
	 * Called automatically when changes are applied to the document. Sets `isEnabled`
	 * to determine whether footnote creation is allowed at the current location.
	 */
	refresh() {
		const model = this.editor.model;
		const lastPosition = model.document.selection.getLastPosition();
		const allowedIn = lastPosition && model.schema.findAllowedParent(lastPosition, BUTTON_ELEMENT);
		this.isEnabled = allowedIn !== null;
	}

}
