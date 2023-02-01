import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { INSERT_BUTTON_COMMAND, TOOLBAR_COMPONENT_NAME } from './constants';
import footnoteIcon from './theme/icon.svg';

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
				icon: footnoteIcon,
                withText: true,
            } );

			button.on('execute', () => {
				editor.execute(INSERT_BUTTON_COMMAND);
			})

            return button;
		} );
	}
}
