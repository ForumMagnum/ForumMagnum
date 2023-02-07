import Command from '@ckeditor/ckeditor5-core/src/command';
import { BUTTON_ELEMENT } from './constants';

export default class InsertButtonCommand extends Command {
	execute(attributes) {
		this.editor.model.enqueueChange(modelWriter => {
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
	 * to determine whether button creation is allowed at the current location.
	 */
	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), BUTTON_ELEMENT );
		const selectedButtonWidget = this._getSelectedButtonWidget(selection);
		this.text = selectedButtonWidget ? selectedButtonWidget.getAttribute( 'data-text' ) : null;
		this.link = selectedButtonWidget ? selectedButtonWidget.getAttribute( 'data-href' ) : null;

		this.isEnabled = allowedIn !== null;
	}

	_getSelectedButtonWidget(selection) {
		const selectedElement = selection.getSelectedElement();
		if (selectedElement && selectedElement.is( 'element', BUTTON_ELEMENT )) {
			return selectedElement;
		}
		return null;
	}
}
