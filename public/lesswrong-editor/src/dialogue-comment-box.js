// import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
// import { Bold, Italic } from '@ckeditor/ckeditor5-basic-styles';
// import { Essentials } from '@ckeditor/ckeditor5-essentials';
// import { Heading } from '@ckeditor/ckeditor5-heading';
// import { List } from '@ckeditor/ckeditor5-list';
// import { Paragraph } from '@ckeditor/ckeditor5-paragraph';

import { Command, Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Widget, toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';

export default class DialogueCommentBox extends Plugin {
    static get requires() {
        return [ SimpleBoxEditing, SimpleBoxUI ];
    }
}

class SimpleBoxUI extends Plugin {
    init() {
        console.log( 'SimpleBoxUI#init() got called' );

        const editor = this.editor;
        const t = editor.t;

        // The "simpleBox" button must be registered among the UI components of the editor
        // to be displayed in the toolbar.
        editor.ui.componentFactory.add( 'simpleBox', locale => {
            // The state of the button will be bound to the widget command.
            const command = editor.commands.get( 'insertSimpleBox' );

            // The button will be an instance of ButtonView.
            const buttonView = new ButtonView( locale );

            buttonView.set( {
                // The t() function helps localize the editor. All strings enclosed in t() can be
                // translated and change when the language of the editor changes.
                label: t( 'Simple Box' ),
                withText: true,
                tooltip: true
            } );

            // Bind the state of the button to the command.
            buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

            // Execute the command when the button is clicked (executed).
            this.listenTo( buttonView, 'execute', () => editor.execute( 'insertSimpleBox' ) );

            return buttonView;
        } );
    }
}

class SimpleBoxEditing extends Plugin {
    static get requires() {
        return [ Widget ];
    }

    init() {
        console.log( 'SimpleBoxEditing#init() got called' );

        this._defineSchema();
        this._defineConverters();
        this._definePostFixers();

        this.editor.commands.add( 'insertSimpleBox', new InsertSimpleBoxCommand( this.editor ) );
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register( 'simpleBox', {
            // Behaves like a self-contained object (e.g. an image).
			isObject: true,

			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowWhere: '$block'
        } );

        schema.register( 'simpleBoxTitle', {
            // Cannot be split or left by the caret.
            isLimit: true,

            allowIn: 'simpleBox',

            // Allow content which is allowed in blocks (i.e. text with attributes).
            allowContentOf: '$block'
        } );

        schema.register( 'simpleBoxDescription', {
            // Cannot be split or left by the caret.
            isLimit: true,

            allowIn: 'simpleBox',

            // Allow content which is allowed in the root (e.g. paragraphs).
            allowContentOf: '$root'
        } );

        schema.addChildCheck( ( context, childDefinition ) => {
            if ( context.endsWith( 'simpleBoxDescription' ) && childDefinition.name == 'simpleBox' ) {
                return false;
            }
        } );
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // <simpleBox> converters
        conversion.for( 'upcast' ).elementToElement( {
            model: 'simpleBox',
            view: {
                name: 'section',
                classes: 'simple-box'
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'simpleBox',
            view: {
                name: 'section',
                classes: 'simple-box'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'simpleBox',
            view: ( modelElement, { writer: viewWriter } ) => {
                const section = viewWriter.createContainerElement( 'section', { class: 'simple-box' } );

                return toWidget( section, viewWriter, { label: 'simple box widget' } );
            }
        } );

        // <simpleBoxTitle> converters
        conversion.for( 'upcast' ).elementToElement( {
            model: 'simpleBoxTitle',
            view: {
                name: 'h1',
                classes: 'simple-box-title'
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'simpleBoxTitle',
            view: {
                name: 'h1',
                classes: 'simple-box-title'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'simpleBoxTitle',
            view: ( modelElement, { writer: viewWriter } ) => {
                // Note: You use a more specialized createEditableElement() method here.
                const h1 = viewWriter.createEditableElement( 'h1', { class: 'simple-box-title' } );

                return toWidgetEditable( h1, viewWriter );
            }
        } );

        // <simpleBoxDescription> converters
        conversion.for( 'upcast' ).elementToElement( {
            model: 'simpleBoxDescription',
            view: {
                name: 'div',
                classes: 'simple-box-description'
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'simpleBoxDescription',
            view: {
                name: 'div',
                classes: 'simple-box-description'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'simpleBoxDescription',
            view: ( modelElement, { writer: viewWriter } ) => {
                // Note: You use a more specialized createEditableElement() method here.
                const div = viewWriter.createEditableElement( 'div', { class: 'simple-box-description' } );

                return toWidgetEditable( div, viewWriter );
            }
        } );
    }
    
    _definePostFixers() {
        this.editor.model.document.registerPostFixer( writer => {
            const root = this.editor.model.document.getRoot();
            const simpleBox = root.getChild( root.childCount - 1 );
    
            if ( simpleBox && simpleBox.is( 'element', 'simpleBox' ) ) {
                // If the simpleBox is already the last child, do nothing.
                return false;
            }
    
            // Find the simpleBox and move it to the end.
            for ( const child of root.getChildren() ) {
                if ( child.is( 'element',  'simpleBox' ) ) {
                    writer.move( writer.createRangeOn( child ), writer.createPositionAt( root, 'end' ) );
                    return true;
                }
            }
    
            return false;
        } );
    }
}




class InsertSimpleBoxCommand extends Command {
    execute() {
        // ensure there's a simple box
        const model = this.editor.model;

        model.change(writer => {
            // Check if a simpleBox already exists in the document.
            const root = model.document.getRoot();
            //console.log("children", root.getChildren())
            if ([...root.getChildren()].every(node => !node.is('element', 'simpleBox'))) {
                // If a simpleBox doesn't exist, create a new one.
                model.insertContent(createSimpleBox(writer));
            }
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'simpleBox');

        this.isEnabled = allowedIn !== null;
    }
}



function createSimpleBox( writer ) {
    const simpleBox = writer.createElement( 'simpleBox' );
    const simpleBoxTitle = writer.createElement( 'simpleBoxTitle' );
    const simpleBoxDescription = writer.createElement( 'simpleBoxDescription' );

    writer.append( simpleBoxTitle, simpleBox );
    writer.append( simpleBoxDescription, simpleBox );

    // There must be at least one paragraph for the description to be editable.
    // See https://github.com/ckeditor/ckeditor5/issues/1464.
    writer.appendElement( 'paragraph', simpleBoxDescription );

    return simpleBox;
}