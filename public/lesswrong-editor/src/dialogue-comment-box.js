// @ts-check
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

        // The "dialogueMessageInput" button must be registered among the UI components of the editor
        // to be displayed in the toolbar.
        editor.ui.componentFactory.add( 'dialogueMessageInput', locale => {
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

        this.editor.commands.add( 'insertSimpleBox', new InsertSimpleBoxCommand( this.editor ) );
        this.editor.commands.add( 'submitDialogueMessage', new SubmitDialogueMessageCommand( this.editor ) );
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register( 'dialogueMessageInput', {
            // Behaves like a self-contained object (e.g. an image).
			// isObject: true,

			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowWhere: '$block',

            // Allow content which is allowed in the root (e.g. paragraphs).
            allowContentOf: '$root',

            isLimit: true,
            isSelectable: false,
            allowAttributes: ['user-id', 'display-name'],
        } );
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // <dialogueMessageInput> converters
        conversion.for( 'upcast' ).elementToElement( {
            model: 'dialogueMessageInput',
            view: {
                name: 'section',
                classes: 'dialogue-message-input',
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'dialogueMessageInput',
            view: {
                name: 'section',
                classes: 'dialogue-message-input'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'dialogueMessageInput',
            view: ( modelElement, { writer: viewWriter } ) => {
                const editor = this.editor
                const button = viewWriter.createUIElement( 'button', { type: 'button', style: 'width: 30px; height: 30px;' }, function (domDocument) {
                    const domElement = this.toDomElement(domDocument);
                    domElement.addEventListener('click', () => {
                        editor.execute('submitDialogueMessage');                        
                    });

                    return domElement;
                });

                const section = viewWriter.createContainerElement( 'section', { class: 'dialogue-message-input', style: 'border: solid' } );
                viewWriter.insert(viewWriter.createPositionAt(section, 0), button);

                return section;
            }
        } );
    }
}




class InsertSimpleBoxCommand extends Command {
    execute() {
        // ensure there's a simple box
        const model = this.editor.model;

        model.change(writer => {
            // Check if a dialogueMessageInput already exists in the document.
            const root = model.document.getRoot();
            //console.log("children", root.getChildren())
            if (Array.from(root.getChildren()).every(node => !node.is('element', 'dialogueMessageInput'))) {
                // If a dialogueMessageInput doesn't exist, create a new one.
                model.insertContent(createSimpleBox(writer));
            }
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'dialogueMessageInput');

        this.isEnabled = allowedIn !== null;
    }
}

class SubmitDialogueMessageCommand extends Command {
    execute() {
        // ensure there's a simple box
        const model = this.editor.model;

        model.change(writer => {
            // Check if a dialogueMessageInput already exists in the document.
            const root = model.document.getRoot();
            if (!root) return;

            Array.from(root.getChildren()).filter(node => node.is('element', 'dialogueMessageInput')).forEach(child => {
                if (child.is('element')) {
                    Array.from(child.getChildren()).forEach(userInput => {
                        writer.append(userInput, root);
                    });
                } else {
                    const paragraph = writer.createElement('paragraph');
                    writer.insertText(child.data, paragraph);
                    writer.append(paragraph, root);
                }
            });
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'dialogueMessageInput');

        this.isEnabled = allowedIn !== null;
    }
}

function createSimpleBox( writer ) {
    const dialogueMessageInput = writer.createElement( 'dialogueMessageInput' );

    // There must be at least one paragraph for the description to be editable.
    // See https://github.com/ckeditor/ckeditor5/issues/1464.
    writer.appendElement( 'paragraph', dialogueMessageInput );

    return dialogueMessageInput;
}