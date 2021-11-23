// @ts-check (uses JSDoc types for type checking)

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import pilcrowIcon from '@ckeditor/ckeditor5-core/theme/icons/pilcrow.svg';
import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import { modelQueryElement, modelQueryElementsAll } from './utils';
import { COMMANDS, ATTRIBUTES, ELEMENTS } from './constants';

export default class FootnoteUI extends Plugin {
	init() {
		const editor = this.editor;
		const translate = editor.t;
		
		editor.ui.componentFactory.add( 'footnote', locale => {
			const dropdownView = createDropdown( locale );

			// Populate the list in the dropdown with items.
			// addListToDropdown( dropdownView, getDropdownItemsDefinitions( placeholderNames ) );
			const command = editor.commands.get( COMMANDS.insertFootnote );
			if(!command) throw new Error("Command not found.");
			
			dropdownView.buttonView.set( {
				label: translate( 'Footnote' ),
				icon: pilcrowIcon,
				tooltip: true
			} );

			dropdownView.class = 'ck-code-block-dropdown';
			dropdownView.bind( 'isEnabled' ).to( command );
			dropdownView.on('change:isOpen', ( evt, propertyName, newValue, oldValue ) => {
				if ( newValue ) {
					addListToDropdown(dropdownView, this.getDropdownItemsDefinitions());
				}
				else {
					dropdownView.listView.items.clear();
				}
			} );
			// Execute the command when the dropdown item is clicked (executed).
			this.listenTo( dropdownView, 'execute', evt => {
				// @ts-ignore
				editor.execute( COMMANDS.insertFootnote, { footnoteId: (evt.source).commandParam } );
				editor.editing.view.focus();
			} );

			return dropdownView;
		} );
		
	}

	getDropdownItemsDefinitions() {
		const itemDefinitions = new Collection();
		const defaultDef = {
			type: 'button',
			model: new Model( {
				commandParam: 0,
				label: 'New footnote',
				withText: true
			} )
		}
		itemDefinitions.add( defaultDef );

		// Does the document already have footnotes?
		const rootElement = this.editor.model.document.getRoot();
		if(!rootElement) {
			throw new Error('Document has no root element.')
		}

		const footnoteSection = modelQueryElement(this.editor, rootElement, element =>  element.name === ELEMENTS.footnoteSection);

		if (footnoteSection) {
			const footnoteLabels = modelQueryElementsAll(this.editor, rootElement, element =>  element.name === ELEMENTS.footnoteLabel);
			footnoteLabels.forEach((footnote) => {
				const id = footnote.getAttribute(ATTRIBUTES.footnoteId);
				const definition = {
					type: 'button',
					model: new Model( {
						commandParam: id,
						label: `Insert footnote ${id}`,
						withText: true
					} )
				};

				// Add the item definition to the collection.
				itemDefinitions.add( definition );
			});
		}

		return itemDefinitions;
	}
}
