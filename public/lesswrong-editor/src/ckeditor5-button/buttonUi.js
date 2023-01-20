import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import footnoteIcon from '../theme/icon.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import { INSERT_BUTTON_COMMAND, TOOLBAR_COMPONENT_NAME } from './constants';

export default class ButtonUI extends Plugin {
	init() {
		const editor = this.editor;
		const translate = editor.t;

		editor.ui.componentFactory.add( TOOLBAR_COMPONENT_NAME, () => {
			const command = editor.commands.get(INSERT_BUTTON_COMMAND);
			if(!command) throw new Error("Command not found.");

			const button = new ButtonView();

            button.set( {
                label: translate( 'Insert Button' ),
                withText: true
            } );

			button.on('execute', () => {
				editor.execute(INSERT_BUTTON_COMMAND);
			})

            return button;
		} );

	}
