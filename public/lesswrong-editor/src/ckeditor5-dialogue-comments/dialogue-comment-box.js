// @ts-check
import { Command, Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Widget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import './dialogue.css';

export default class DialogueCommentBox extends Plugin {
    static get requires() {
        return [ SimpleBoxEditing, SimpleBoxUI ];
    }
}

class SimpleBoxUI extends Plugin {
    init() {
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
                label: t( 'Non-message Block' ),
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
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'insertSimpleBox', new InsertRootParagraphBoxCommand( this.editor ) );
        this.editor.commands.add( 'submitDialogueMessage', new SubmitDialogueMessageCommand( this.editor ) );

        const viewDocument = this.editor.editing.view.document;
		const editor = this.editor;

        this.listenTo( viewDocument, 'delete', (evt, data) => {
            const doc = editor.model.document;
            const selectedBlocks = Array.from(doc.selection.getSelectedBlocks());
            const deletedElement = selectedBlocks[0];
            if (!deletedElement || !deletedElement.parent) return;

            const messageParent = deletedElement.getAncestors().find(ancestor => ancestor.is('element', 'dialogueMessage'));
            if (!messageParent) return;

            const isFirstChild = messageParent.getChildIndex(deletedElement) === 0;
            const selectionStartPos = doc.selection.getFirstPosition();

            if (!selectionStartPos) return;

            const isAtStart = selectionStartPos.isAtStart;
            const zeroSelectionRange = doc.selection.isCollapsed;
            const startParagraph = selectionStartPos.findAncestor('paragraph');

            if (!startParagraph) return;

            const messageIsEmpty = startParagraph.maxOffset === 0;
            
            if (isFirstChild && zeroSelectionRange && isAtStart && !messageIsEmpty) {
                data.preventDefault();
                evt.stop();
            }
        });
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register( 'dialogueMessageInput', {
			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowWhere: '$block',

            // Allow content which is allowed in the root (e.g. paragraphs).
            allowContentOf: '$root',

            isLimit: true,
            allowAttributes: ['user-id', 'display-name', 'user-order'],
        } );

        schema.register( 'dialogueMessage', {
			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowIn: '$root',

            // Allow content which is allowed in the root (e.g. paragraphs).
            allowContentOf: '$root',

            allowAttributes: ['message-id', 'user-id', 'display-name', 'submitted-date', 'user-order'],
        });

        schema.addChildCheck((context, childDefinition) => {
            if (
                (context.endsWith('dialogueMessage') || context.endsWith('dialogueMessageInput')) &&
                (childDefinition.name === 'dialogueMessage' || childDefinition.name === 'dialogueMessageHeader')
            ) {
                return false;
            }
        });

        // schema.register( 'dialogueMessageHeader', {
        //     allowWhere: 'dialogueMessage',
        //     allowContentOf: '$root',
        //     // isLimit: true,
        //     allowAttributes: ['message-id', 'user-id', 'display-name', 'submitted-date']
        // });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // <dialogueMessageInput> converters
        conversion.for( 'upcast' ).elementToElement( {
            model: (viewElement, { writer: modelWriter }) => {
                return modelWriter.createElement('dialogueMessageInput');
            },
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

                const buttonAttributes = { type: 'button', class: 'CommentsNewForm-formButton MuiButton-root MuiButtonBase-root' };
                const button = viewWriter.createUIElement( 'button', buttonAttributes, function (domDocument) {
                    const domElement = this.toDomElement(domDocument);
                    domElement.contentEditable = 'false';
                    domElement.innerHTML = 'Submit';
                    domElement.addEventListener('click', () => {
                        const userId = modelElement.getAttribute('user-id');
                        const displayName = modelElement.getAttribute('display-name');
                        editor.execute('submitDialogueMessage', { userId, displayName });
                    });

                    return domElement;
                });

                const userDisplayName = getUserDisplayName(modelElement);
                const headerAttributes = { class: 'dialogue-message-input-header CommentUserName-author UsersNameDisplay-noColor' };
                const headerElement = viewWriter.createUIElement('div', headerAttributes, function(domDocument) {
                    const domElement = this.toDomElement(domDocument);
                    domElement.contentEditable = 'false';

                    domElement.append(userDisplayName);

                    return domElement;
                });

                const userOrder = getUserOrder(modelElement);
                const userId = modelElement.getAttribute('user-id');
                const sectionAttributes = { class: 'dialogue-message-input ContentStyles-debateResponseBody', 'user-order': userOrder, 'user-id': userId };
                const section = viewWriter.createContainerElement( 'section', sectionAttributes );

                viewWriter.insert(viewWriter.createPositionAt(section, 0), button);
                viewWriter.insert(viewWriter.createPositionAt(section, 0), headerElement);

                return toWidgetEditable(section, viewWriter);
            }
        } );

        // <dialogueMessage> converters
        conversion.for( 'upcast' ).elementToElement( {
            model: (viewElement, { writer: modelWriter }) => {
                const attributes = Object.fromEntries(Array.from(viewElement.getAttributes()));
                return modelWriter.createElement('dialogueMessage', attributes);
            },
            view: {
                name: 'section',
                classes: 'dialogue-message',
                attributes: {
                    'message-id': true,
                    'user-id': true,
                    'display-name': true,
                    'submitted-date': true,
                    'user-order': true
                }
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'dialogueMessage',
            view: generateDialogueMessageView('dialogue-message ContentStyles-debateResponseBody')
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'dialogueMessage',
            view: ( modelElement, { writer: viewWriter } ) => {
                const userOrder = getUserOrder(modelElement);
                const sectionAttributes = { class: 'dialogue-message ContentStyles-debateResponseBody', 'user-order': userOrder };
                const section = viewWriter.createContainerElement( 'section', sectionAttributes );

                const userDisplayName = getUserDisplayName(modelElement);

                const headerAttributes = {
                    class: 'dialogue-message-header CommentUserName-author UsersNameDisplay-noColor',
                    contenteditable: 'false'
                };

                const headerElement = viewWriter.createUIElement('section', headerAttributes, function(domDocument) {
                    const domElement = this.toDomElement(domDocument);
                    domElement.contentEditable = 'false';
                    domElement.append(userDisplayName);

                    return domElement;
                });

                viewWriter.insert(viewWriter.createPositionAt(section, 0), headerElement);

                return section;
            }
        } );

        // <dialogueMessageHeader> converters
        // conversion.for( 'upcast' ).elementToElement( {
        //     model: (viewElement, { writer: modelWriter }) => {
        //         const attributes = Object.fromEntries(Array.from(viewElement.getAttributes()));
        //         return modelWriter.createElement('dialogueMessageHeader', attributes);
        //     },
        //     view: {
        //         name: 'section',
        //         classes: 'dialogue-message-header',
        //         attributes: {
        //             'message-id': true,
        //             'user-id': true,
        //             'display-name': true,
        //             'submitted-date': true
        //         }
        //     }
        // } );
        // conversion.for( 'dataDowncast' ).elementToElement( {
        //     model: 'dialogueMessageHeader',
        //     view: generateDialogueMessageHeaderView('dialogue-message-header CommentUserName-author UsersNameDisplay-noColor')
        // } );
        // conversion.for( 'editingDowncast' ).elementToElement( {
        //     model: 'dialogueMessageHeader',
        //     view: ( modelElement, { writer: viewWriter }) => {
        //         const userDisplayName = getUserDisplayName(modelElement);

        //         const headerAttributes = {
        //             class: 'dialogue-message-header CommentUserName-author UsersNameDisplay-noColor',
        //             contenteditable: 'false'
        //         };

        //         const headerElement = viewWriter.createUIElement('section', headerAttributes, function(domDocument) {
        //             const domElement = this.toDomElement(domDocument);
        //             domElement.contentEditable = 'false';
        //             domElement.append(userDisplayName);

        //             return domElement;
        //         });

        //         return headerElement;
        //     }
        // } );
    }
}


class InsertRootParagraphBoxCommand extends Command {
    execute() {
        const model = this.editor.model;

        model.change(writer => {
            const paragraph = writer.createElement('paragraph');
            const selectedBlocks = Array.from(model.document.selection.getSelectedBlocks());
            model.insertContent(paragraph, writer.createPositionBefore(selectedBlocks[0].parent), 'before');
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;

        let childOfDialogueMessage = false;
        let currentElement = Array.from(selection.getSelectedBlocks())[0];
        while (currentElement) {
            if (currentElement && currentElement.is('element', 'dialogueMessage')) {
                childOfDialogueMessage = true;
                break;
            }

            currentElement = currentElement.parent;
        }

        this.isEnabled = childOfDialogueMessage;
    }
}

class SubmitDialogueMessageCommand extends Command {
    execute( { userId, displayName } ) {
        if (!userId || !displayName) return
        const model = this.editor.model;

        model.change(writer => {
            const root = model.document.getRoot();
            if (!root) return;

            const dialogueMessageInput = Array.from(root.getChildren()).find(node => (
                node.is('element', 'dialogueMessageInput') && node.getAttribute('user-id') === userId
            ));
		  
			const dialogueConfig = this.editor.config.get('dialogues')

            if (dialogueMessageInput) {
                const submittedDate = (new Date()).toUTCString();
                const messageId = `${userId}-${submittedDate}`;
                const messageAttributes = { 'message-id': messageId, 'user-id': userId, 'display-name': displayName, 'submitted-date': (new Date()).toUTCString() };

                const dialogueMessage = writer.createElement('dialogueMessage', messageAttributes);
                // const dialogueMessageHeader = writer.createElement('dialogueMessageHeader', messageAttributes);

                // writer.append(dialogueMessageHeader, dialogueMessage);

                if (dialogueMessageInput.is('element')) {
                    writer.append(dialogueMessage, root);
                    const inputContents = Array.from(dialogueMessageInput.getChildren());
                    if (inputContents.length === 0) {
                        writer.appendElement('paragraph', dialogueMessage);
                    }

                    Array.from(dialogueMessageInput.getChildren()).forEach(userInput => {
                        console.log({ userInput });
                        writer.append(userInput, dialogueMessage);
                    });
                    // After we are done moving, add a new paragraph to dialogueMessageInput, so it's not empty
                    writer.appendElement('paragraph', dialogueMessageInput)
                } else {
                    writer.insertText(dialogueMessageInput.data, dialogueMessage);
                    writer.append(dialogueMessage, root);
                }
				
				writer.setSelection(dialogueMessageInput, 0)
			    // notificationCallback()
			  	dialogueConfig.dialogueParticipantNotificationCallback()
			  
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

function generateDialogueMessageView(className) {
    return (modelElement, { writer: viewWriter }) => {
        const attributeList = [
            'message-id',
            'user-id',
            'display-name',
            'submitted-date',
            'user-order'
        ];

        const sectionAttributes = Object.fromEntries(attributeList.map(attribute => [attribute, modelElement.getAttribute(attribute)]));

        return viewWriter.createContainerElement('section', { class: className, ...sectionAttributes });
    };
}

function generateDialogueMessageHeaderView(className) {
    return (modelElement, { writer: viewWriter }) => {
        const attributeList = [
            'message-id',
            'user-id',
            'display-name',
            'submitted-date',
        ];

        const sectionAttributes = Object.fromEntries(attributeList.map(attribute => [attribute, modelElement.getAttribute(attribute)]));

        return viewWriter.createContainerElement('section', { class: className, ...sectionAttributes });
    };
}

/**
 * @param {import('@ckeditor/ckeditor5-engine').Element} modelElement 
 */
function getUserOrder(modelElement) {
    return (modelElement.getAttribute('user-order') || '1').toString();
}

/**
 * @param {import('@ckeditor/ckeditor5-engine').Element} modelElement 
 */
function getUserDisplayName(modelElement) {
    return (modelElement.getAttribute('display-name') || '').toString();
}
