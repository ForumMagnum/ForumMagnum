// @ts-check (uses JSDoc types for type checking)

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
// @ts-ignore-next-line
import footnoteIcon from '../theme/ckeditor5-footnote-icon.svg';
import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import { modelQueryElement, modelQueryElementsAll } from './utils';
import { COMMANDS, ATTRIBUTES, ELEMENTS, TOOLBAR_COMPONENT_NAME } from './constants';
import type { ListDropdownItemDefinition } from '@ckeditor/ckeditor5-ui'

export default class FootnoteUI extends Plugin {
	init() {
		/** @type {import('@ckeditor/ckeditor5-core/src/editor/editorwithui').EditorWithUI} */
		 // @ts-ignore
		const editor = this.editor;
		const translate = editor.t;

		editor.ui.componentFactory.add( TOOLBAR_COMPONENT_NAME, locale => {
			const dropdownView = createDropdown( locale );

			// Populate the list in the dropdown with items.
			// addListToDropdown( dropdownView, getDropdownItemsDefinitions( placeholderNames ) );
			const command = editor.commands.get( COMMANDS.insertFootnote );
			if(!command) throw new Error("Command not found.");

			dropdownView.buttonView.set( {
				label: translate( 'Footnote' ),
				icon: footnoteIcon,
				tooltip: true
			} );

			dropdownView.class = 'ck-code-block-dropdown';
			dropdownView.bind( 'isEnabled' ).to( command );
			dropdownView.on('change:isOpen', ( evt, propertyName, newValue, oldValue ) => {
				if ( newValue ) {
					addListToDropdown(dropdownView, this.getDropdownItemsDefinitions() as AnyBecauseTodo);
				}
				else {
					dropdownView.listView.items.clear();
				}
			} );
			// Execute the command when the dropdown item is clicked (executed).
			this.listenTo( dropdownView, 'execute', evt => {
				// @ts-ignore
				editor.execute( COMMANDS.insertFootnote, { footnoteIndex: (evt.source).commandParam } );
				editor.editing.view.focus();
			} );

			return dropdownView;
		} );

	}

	getDropdownItemsDefinitions(): Collection<ListDropdownItemDefinition> {
		const itemDefinitions = new Collection<ListDropdownItemDefinition>();
		const defaultDef: ListDropdownItemDefinition = {
			type: 'button',
			model: new Model( {
				commandParam: 0,
				label: 'New footnote',
				withText: true
			} )
		}
		itemDefinitions.add( defaultDef );

		const rootElement = this.editor.model.document.getRoot();
		if(!rootElement) {
			throw new Error('Document has no root element.')
		}

		const footnoteSection = modelQueryElement(this.editor, rootElement, element =>  element.is('element', ELEMENTS.footnoteSection));

		if (footnoteSection) {
			const footnoteItems = modelQueryElementsAll(this.editor, rootElement, element =>  element.is('element', ELEMENTS.footnoteItem));
			footnoteItems.forEach((footnote) => {
				const index = footnote.getAttribute(ATTRIBUTES.footnoteIndex);
				const definition: ListDropdownItemDefinition = {
					type: 'button',
					model: new Model( {
						commandParam: index,
						label: `Insert footnote ${index}`,
						withText: true
					} )
				};

				itemDefinitions.add( definition );
			});
		}

		return itemDefinitions;
	}
}
