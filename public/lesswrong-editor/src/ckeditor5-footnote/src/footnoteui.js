// @ts-check (uses JSDoc types for type checking)

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
// @ts-ignore-next-line
import footnoteIcon from '../theme/icon.svg';
import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import { modelQueryElement, modelQueryElementsAll } from './utils';
import { COMMANDS, ATTRIBUTES, ELEMENTS, TOOLBAR_COMPONENT_NAME } from './constants';
import { ListDropdownItemDefinition } from '@ckeditor/ckeditor5-ui'

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

	/**
	 * @returns {Collection<ListDropdownItemDefinition>}
	 */
	getDropdownItemsDefinitions() {
		/** @type {Collection<ListDropdownItemDefinition>} */
		const itemDefinitions = new Collection();
		/** @type {ListDropdownItemDefinition} */
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
				/** @type {ListDropdownItemDefinition} */
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
