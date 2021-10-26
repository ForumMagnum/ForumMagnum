// @ts-check
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import pilcrowIcon from '@ckeditor/ckeditor5-core/theme/icons/pilcrow.svg';
import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import { QueryMixin } from './utils';
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';

export default class FootNoteUI extends QueryMixin(Plugin) {
    init() {
        const editor = this.editor;
        const t = editor.t;
        
        editor.ui.componentFactory.add( 'footnote', locale => {
            const dropdownView = createDropdown( locale );

            // Populate the list in the dropdown with items.
            // addListToDropdown( dropdownView, getDropdownItemsDefinitions( placeholderNames ) );
            const command = editor.commands.get( 'InsertFootnote' );
			if(!command) throw new Error("Command not found.");
            
            dropdownView.buttonView.set( {
                label: t( 'Footnote' ),
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
                editor.execute( 'InsertFootnote', { footnoteId: (evt.source).commandParam } );
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

		const footNoteSection = this.queryDescendantFirst({rootElement, predicate: (e) => e.name === 'footNoteSection'});

		if (footNoteSection) {
			const footNoteItems = this.queryDescendantsAll({rootElement, predicate: e => e.name === 'footNoteItem'});
			footNoteItems.forEach((footNote) => {
				// @ts-ignore
				const id = footNote.getAttribute('data-footnote-id');
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
