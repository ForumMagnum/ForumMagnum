import ButtonEditing from './buttonEditing';
import ButtonUI from './buttonUi/';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class Button extends Plugin {
	static get requires() {
		return [ ButtonEditing, ButtonUI ];
	}
}
