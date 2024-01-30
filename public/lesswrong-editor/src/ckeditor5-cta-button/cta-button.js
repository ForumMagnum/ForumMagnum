import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import DropdownView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import BalloonPanelView from '@ckeditor/ckeditor5-ui/src/panel/balloon/balloonpanelview';

export default class CTAButton extends Plugin {
    static get requires() {
        return [ ContextualBalloon, Widget ];
    }

    init() {
        this._defineSchema()
        this._defineConverters()

        const editor = this.editor
        // Initialize the ContextualBalloon plugin
        this._balloon = editor.plugins.get(ContextualBalloon);

        editor.ui.componentFactory.add('ctaButtonToolbarItem', locale => {
            const view = new ButtonView(locale);

            view.set({
                label: 'Button',
                withText: true,
                tooltip: true
            });

            // When creating the CTA button, you no longer need to append the text node directly
            view.on('execute', () => {
                const model = editor.model;

                model.change(writer => {
                    // Insert the button as a new block after the current block
                    const selection = editor.model.document.selection;
                    const currentElement = selection.getFirstPosition().parent;
                    const positionAfterCurrentBlock = writer.createPositionAfter(currentElement);

                    const buttonElement = writer.createElement('ctaButton');
                    const buttonText = writer.createText('Hello world'); // Create a text node
                    writer.append(buttonText, buttonElement); // Append the text node to the buttonElement

                    // Insert the 'ctaButton' element at the calculated position
                    model.insertContent(buttonElement, positionAfterCurrentBlock);
                });
            });

            return view;
        });

        // Create and add the dropdown to the component factory
        editor.ui.componentFactory.add('ctaButtonDropdown', locale => {
            const dropdownView = this._createDropdownView(locale);
            // ... setup dropdown behavior

            return dropdownView;
        });

        this._setupWidgetInteraction()
    }

    _defineSchema() {
        const schema = this.editor.model.schema;
    
        schema.register('ctaButton', {
            // Allow where block elements (e.g. paragraphs) are allowed
            allowWhere: '$block',
            isBlock: true,
            allowContentOf: '$block', // Allow block content inside the button for editing
            allowIn: '$root',
            // Allow attributes which should be preserved in the model
            allowAttributes: ['id', 'class']
        });
    }

    _createDropdownView(locale) {
        const editor = this.editor;
        const dropdownView = createDropdown(locale);

        // Add a simple list to the dropdown for demonstration purposes
        const items = new Collection();

        items.add({
            type: 'button',
            model: new Model({
                withText: true,
                label: 'Edit CTA Text'
            })
        });

        addListToDropdown(dropdownView, items);

        console.log('created dropdown')
        // Set up the dropdown's behavior (e.g., what happens when an item is clicked)
        dropdownView.on('execute', evt => {
            const commandName = evt.source.commandName;
            if (commandName === 'editCtaText') {
                // Logic to handle the editing of the CTA button's text
                console.log('CTA text edit action triggered');
            }
        });

        return dropdownView;
    }
    
    _defineConverters() {
        const editor = this.editor;
    
        // Editing downcast conversion: model 'ctaButton' to a 'div' in the editing view
        editor.conversion.for('editingDowncast').elementToElement({
            model: 'ctaButton',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createEditableElement('div', {
                    class: 'cta-button'
                });
    
                // Enable the widget handling on a div element inside the editing view.
                // Note: toWidgetEditable removes the block level enter icons
                return toWidget(div, viewWriter);
            }
        });
    
        // Data downcast conversion: model 'ctaButton' to a 'div' in the data view
        editor.conversion.for('dataDowncast').elementToElement({
            model: 'ctaButton',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'cta-button'
                });
                return div;
            }
        });
    
        // Upcast conversion: 'div' in the data view to model 'ctaButton'
        editor.conversion.for('upcast').elementToElement({
            view: {
                name: 'div',
                classes: 'cta-button'
            },
            model: (viewElement, { writer: modelWriter }) => {
                return modelWriter.createElement('ctaButton');
            }
        });
    }

    _setupWidgetInteraction() {
        const editor = this.editor;
        const balloon = editor.plugins.get('ContextualBalloon');
    
        // Listen for the widget being clicked
        editor.editing.view.document.on('click', (evt, data) => {
            const viewElement = data.target;
    
            if (viewElement.hasClass('cta-button')) {
                // Prevent the default click action
                data.preventDefault();
    
                // Check if the balloon panel is already visible
                if (balloon.hasView(this.balloonPanel)) {
                    return;
                }
    
                // Create the BalloonPanelView if it doesn't exist
                if (!this.balloonPanel) {
                    this.balloonPanel = new BalloonPanelView(editor.locale);
    
                    // Add content to the balloon panel
                    this.balloonPanel.content.add({
                        text: 'Edit CTA Text'
                    });
    
                    // Render the balloon panel
                    this.balloonPanel.render();
                }
    
                // Add the BalloonPanelView to the ContextualBalloon plugin
                balloon.add({
                    view: this.balloonPanel,
                    position: {
                        target: viewElement,
                        positions: BalloonPanelView.defaultPositions
                    }
                });
    
                // Show the balloon panel
                balloon.showStack('main');
            }
        });
    }
}