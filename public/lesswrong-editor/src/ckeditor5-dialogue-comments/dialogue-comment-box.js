// @ts-check
import { Command, Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Widget, toWidgetEditable, toWidget } from '@ckeditor/ckeditor5-widget';
import { ELEMENTS as FOOTNOTE_ELEMENTS } from '../ckeditor5-footnote/src/constants';

export default class DialogueCommentBox extends Plugin {
    static get requires() {
        return [ SimpleBoxEditing, SimpleBoxUI, SimpleBoxButton ];
    }
}

class SimpleBoxUI extends Plugin {
    init() {
        /**
         * @type {EditorWithUI}
         */
        const editor = this.editor;
        const t = editor.t;

        // The "dialogueMessageInput" button must be registered among the UI components of the editor
        // to be displayed in the toolbar.
        editor.ui.componentFactory.add( 'rootParagraphBox', locale => {
            // The state of the button will be bound to the widget command.
            const command = editor.commands.get( 'insertRootParagraphBox' );

            // The button will be an instance of ButtonView.
            const buttonView = new ButtonView( locale );

            buttonView.set( {
                // The t() function helps localize the editor. All strings enclosed in t() can be
                // translated and change when the language of the editor changes.
                label: t( 'Non-message Block foobar' ),
                withText: true,
                tooltip: true
            } );

            // Bind the state of the button to the command.
            buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

            // Execute the command when the button is clicked (executed).
            this.listenTo( buttonView, 'execute', () => editor.execute( 'insertRootParagraphBox' ) );

            return buttonView;
        } );
    }
}

class SimpleBoxButton extends Plugin {
    init() {
        /**
         * @type {EditorWithUI}
         */
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add( 'simpleBoxButton', locale => {
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

class InsertSimpleBoxCommand extends Command {
	execute() {
		this.editor.model.change( writer => {
			// Insert <simpleBox>*</simpleBox> at the current selection position
			// in a way that will result in creating a valid model structure.
			this.editor.model.insertContent( createSimpleBox( writer ) );
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), 'simpleBox' );

		this.isEnabled = allowedIn !== null;
	}
}

class SimpleBoxEditing extends Plugin {
    static get requires() {
        return [ Widget ];
    }

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'insertRootParagraphBox', new InsertRootParagraphBoxCommand( this.editor ) );
        this.editor.commands.add( 'insertSimpleBox', new InsertSimpleBoxCommand( this.editor ) );
        this.editor.commands.add( 'submitDialogueMessage', new SubmitDialogueMessageCommand( this.editor ) );

        this.editor.keystrokes.set( 'Ctrl+Enter', (evt, cancel) => {
			const selection = editor.model.document.selection;
			const selectedBlocks = Array.from(selection.getSelectedBlocks())
			const cursorOnCommentBox = selectedBlocks.some( block => block.is('element', 'dialogueMessageInput') || block.getAncestors().some( ancestor => ancestor.is('element', 'dialogueMessageInput')))
			if (cursorOnCommentBox) this.editor.execute( 'submitDialogueMessage' )
		})

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

        schema.register( 'dialogueMessageInputWrapper', {
			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowIn: '$root',
            allowChildren: 'dialogueMessageInput'
        } );

        schema.register( 'dialogueMessageInput', {
			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowIn: 'dialogueMessageInputWrapper',

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
            isObject: true
        });

        schema.register( 'dialogueMessageContent', {
            allowIn: 'dialogueMessage',
            allowContentOf: '$root',
            isLimit: true
        });

        const forbiddenMessageChildren = [
            'dialogueMessage',
            'dialogueMessage',
            ...Object.values(FOOTNOTE_ELEMENTS)
        ];

        const forbiddenInputChilden = [
            'dialogueMessage',
            'dialogueMessageHeader',
            'dialogueMessageInput',
            'dialogueMessageInputWrapper',
            ...Object.values(FOOTNOTE_ELEMENTS)
        ];

        schema.addChildCheck((context, childDefinition) => {
            // Explicitly forbid some degenerate cases
            // Some of these are doubtless ruled out by the schema definitions above, but they often behave in pretty weird ways
            if (context.endsWith('dialogueMessage') && forbiddenMessageChildren.includes(childDefinition.name)) {
                return false;
            }

            if (context.endsWith('dialogueMessageInput') && forbiddenInputChilden.includes(childDefinition.name)) {
                return false;
            }
        });

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
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // <dialogueMessageInputWrapper> converters
        const inputWrapperView = {
            name: 'div',
            classes: 'dialogue-message-input-wrapper',
        };

        conversion.for( 'upcast' ).elementToElement( {
            model: (viewElement, { writer: modelWriter }) => {
                return modelWriter.createElement('dialogueMessageInputWrapper');
            },
            view: inputWrapperView
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'dialogueMessageInputWrapper',
            view: inputWrapperView
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'dialogueMessageInputWrapper',
            view: inputWrapperView
        } )
        

        // <dialogueMessageInput> converters
        conversion.for( 'upcast' ).elementToElement( {
            model: (viewElement, { writer: modelWriter }) => {
                const attributes = Object.fromEntries(Array.from(viewElement.getAttributes()));
                return modelWriter.createElement('dialogueMessageInput', attributes);
            },
            view: {
                name: 'section',
                classes: 'dialogue-message-input',
                attributes: {
                    'user-id': true,
                    'display-name': true,
                    'user-order': true
                }
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'dialogueMessageInput',
            view: getDataDowncastViewGenerator('dialogue-message-input', [
                'user-id',
                'user-order',
                'display-name'
            ])
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'dialogueMessageInput',
            // Need to bind for `this.editor` referenced in the function
            view: inputEditingDowncastViewGenerator.bind(this)
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
            view: getDataDowncastViewGenerator('dialogue-message ContentStyles-debateResponseBody', [
                'message-id',
                'user-id',
                'display-name',
                'submitted-date',
                'user-order'
            ])
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'dialogueMessage',
            view: messageEditingDowncastViewGenerator
        } );

        // <dialogueMessageContent> converters
        conversion.for( 'upcast' ).elementToElement( {
            model: 'dialogueMessageContent',
            view: {
                name: 'div',
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'dialogueMessageContent',
            view: {
                name: 'div',
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'dialogueMessageContent',
            view: messageContentDowncastViewGenerator
        } );

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
    execute() {
        const me = this.editor.plugins.get( 'Users' ).me;
	    const { id: userId, name: displayName } = me;
	    if (!userId || !displayName) return;
        const model = this.editor.model;

        model.change(writer => {
            const root = model.document.getRoot();
            if (!root) return;

            const dialogueMessageInput = findMessageInputs(root).find(node => node.getAttribute('user-id') === userId);
		  
			const dialogueConfig = this.editor.config.get('dialogues');

            if (dialogueMessageInput) {
                const submittedDate = (new Date()).toUTCString();
                const messageId = `${userId}-${submittedDate}`;
                const messageAttributes = { 'message-id': messageId, 'user-id': userId, 'display-name': displayName, 'submitted-date': (new Date()).toUTCString() };

                const dialogueMessage = writer.createElement('dialogueMessage', messageAttributes);

                if (dialogueMessageInput.is('element')) {
                    writer.append(dialogueMessage, root);

                    const contentDiv = writer.createElement('dialogueMessageContent');

                    const inputContents = Array.from(dialogueMessageInput.getChildren());
                    if (inputContents.length === 0) {
                        const paragraph = writer.createElement('paragraph');
                        writer.append(paragraph, contentDiv);
                        writer.append(paragraph, dialogueMessage);
                    }

                    inputContents.forEach(userInput => {
                        const paragraph = writer.createElement('paragraph');
                        let userInputText = userInput;
                        let iterations = 0;
                        while (!userInputText.is('text') && iterations < 5) {
                            const child = userInputText.getChild(0);
                            if (child) {
                                userInputText = child;
                            } else {
                                break;
                            }
                            iterations++;
                        }

                        // at this point, userInput should be Text, or something's gone wrong
                        if (userInputText.is('text')) {
                            writer.insertText(userInputText.data, paragraph);
                        }
                        writer.append(paragraph, contentDiv);
                        writer.remove(userInput);
                    });

                    writer.append(contentDiv, dialogueMessage);

                    // After we are done moving, add a new paragraph to dialogueMessageInput, so it's not empty
                    writer.appendElement('paragraph', dialogueMessageInput);
                } else {
                    // const messageChildren = Array.from(dialogueMessage.getChildren());
                    // writer.insertText(dialogueMessageInput.data, messageChildren[0]);
                    console.log(`else block of dialogueMessageInput.is('element')`, { dialogueMessage });
                    // writer.append(dialogueMessage, root);
                }
				
				writer.setSelection(dialogueMessageInput, 0);
			  	dialogueConfig.dialogueParticipantNotificationCallback();
            }
        });
    }

    refresh() {
        this.isEnabled = true;
    }
}

/**
 * @typedef {import('@ckeditor/ckeditor5-core/src/editor/editorwithui').EditorWithUI} EditorWithUI
 * @typedef {import('@ckeditor/ckeditor5-core/src/editor/editor').default} Editor
 * @typedef {import('@ckeditor/ckeditor5-engine').DowncastWriter} DowncastWriter
 * @typedef {Exclude<ReturnType<import('@ckeditor/ckeditor5-engine').Model['document']['getRoot']>, null>} RootElement
 * @typedef {import('@ckeditor/ckeditor5-engine').Element} Element
 * @typedef {import('@ckeditor/ckeditor5-engine/src/model/text').default} Text
 * @typedef {import('@ckeditor/ckeditor5-engine/src/view/containerelement').default} ContainerElement
 * @typedef {Exclude<Parameters<ReturnType<import('@ckeditor/ckeditor5-engine').Conversion['for']>['elementToElement']>[0], undefined>['view']} ViewElementDefinition
 * @typedef {Extract<ViewElementDefinition, (_0, _1) => ContainerElement>} ContainerElementDefinitionGenerator
 */

/**
 * @param {DowncastWriter} viewWriter 
 * @param {Record<string, any>} buttonAttributes 
 * @param {Editor | EditorWithUI} editor 
 */
function createButtonElement(viewWriter, buttonAttributes, editor) {
    return viewWriter.createUIElement('button', buttonAttributes, function (domDocument) {
        const domElement = this.toDomElement(domDocument);
        domElement.contentEditable = 'false';
        domElement.innerHTML = 'Submit';
        domElement.addEventListener('click', () => editor.execute('submitDialogueMessage'));

        return domElement;
    });
}

/**
 * @param {DowncastWriter} viewWriter 
 * @param {string} elementName
 * @param {Record<string, any>} headerAttributes 
 * @param {string} userDisplayName 
 */
function createHeaderElement(viewWriter, elementName, headerAttributes, userDisplayName) {
    return viewWriter.createUIElement(elementName, headerAttributes, function (domDocument) {
        const domElement = this.toDomElement(domDocument);
        domElement.contentEditable = 'false';
        domElement.append(userDisplayName);

        return domElement;
    });
}

/**
 * @param {RootElement} root 
 */
function findMessageInputs(root) {
    const rootChildren = Array.from(root.getChildren());
    // For backwards compatibility, when we didn't have a wrapper around the message inputs
    const rootInputs = rootChildren.filter(child => child.is('element', 'dialogueMessageInput'));
    /**
     * @type {Element}
     */
    const dialogueMessageInputWrapper = rootChildren.find(child => child.is('element', 'dialogueMessageInputWrapper'));

    if (!dialogueMessageInputWrapper) return rootInputs;

    const wrapperInputs = Array.from(dialogueMessageInputWrapper.getChildren()).filter(child => child.is('element', 'dialogueMessageInput'));
    return [...rootInputs, ...wrapperInputs];
}

/**
 * 
 * @param {string} className 
 * @param {string[]} attributeList
 * @returns {ContainerElementDefinitionGenerator}
 */
function getDataDowncastViewGenerator(className, attributeList) {
    return (modelElement, { writer: viewWriter }) => {
        const sectionAttributes = Object.fromEntries(attributeList.map(attribute => [attribute, modelElement.getAttribute(attribute)]));
        return viewWriter.createContainerElement('section', { class: className, ...sectionAttributes });
    };
}

/**
 * @type {ContainerElementDefinitionGenerator}
 */
function inputEditingDowncastViewGenerator(modelElement, { writer: viewWriter }) {
    const editor = this.editor;

    const buttonAttributes = { type: 'button', class: 'CommentsNewForm-formButton MuiButton-root MuiButtonBase-root' };
    const button = createButtonElement(viewWriter, buttonAttributes, editor);

    const userDisplayName = getUserDisplayName(modelElement);
    const headerAttributes = { class: 'dialogue-message-input-header CommentUserName-author UsersNameDisplay-noColor' };
    const headerElement = createHeaderElement(viewWriter, 'div', headerAttributes, userDisplayName);

    const userOrder = getUserOrder(modelElement);
    const userId = modelElement.getAttribute('user-id');
    const sectionAttributes = { class: 'dialogue-message-input ContentStyles-debateResponseBody', 'user-order': userOrder, 'user-id': userId, 'display-name': userDisplayName };
    const section = viewWriter.createContainerElement( 'section', sectionAttributes );

    viewWriter.insert(viewWriter.createPositionAt(section, 0), button);
    viewWriter.insert(viewWriter.createPositionAt(section, 0), headerElement);

    return toWidgetEditable(section, viewWriter);
}

/**
 * @type {ContainerElementDefinitionGenerator}
 */
function messageEditingDowncastViewGenerator(modelElement, { writer: viewWriter }) {
    const userOrder = getUserOrder(modelElement);
    const sectionAttributes = { class: 'dialogue-message ContentStyles-debateResponseBody', 'user-order': userOrder };
    const section = viewWriter.createContainerElement( 'section', sectionAttributes );

    const userDisplayName = getUserDisplayName(modelElement);
    const headerAttributes = {
        class: 'dialogue-message-header CommentUserName-author UsersNameDisplay-noColor',
        contenteditable: 'false'
    };
    const headerElement = createHeaderElement(viewWriter, 'section', headerAttributes, userDisplayName);

    viewWriter.insert(viewWriter.createPositionAt(section, 0), headerElement);

    return toWidget(section, viewWriter, { hasSelectionHandle: true });
}

/**
 * @type {ContainerElementDefinitionGenerator}
 */
function messageContentDowncastViewGenerator(modelElement,  { writer: viewWriter }) {
    const contentElement = viewWriter.createEditableElement('div');
    return toWidgetEditable(contentElement, viewWriter);
}

/**
 * @param {Element} modelElement 
 */
function getUserOrder(modelElement) {
    return (modelElement.getAttribute('user-order') || '1').toString();
}

/**
 * @param {Element} modelElement 
 */
function getUserDisplayName(modelElement) {
    return (modelElement.getAttribute('display-name') || '').toString();
}
