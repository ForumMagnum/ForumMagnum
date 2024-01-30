import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';
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
        return [ Widget ];
    }

    init() {
        const editor = this.editor

        // Define the properties of the ctaButton element to allow in the model
        this._defineSchema()
        // Define the conversions from model -> data view, model -> editing view, editing view -> model
        this._defineConverters()

        // Add the toolbar item for inserting a cta button
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
                    const buttonText = writer.createText('Apply now'); // Create a text node
                    writer.append(buttonText, buttonElement); // Append the text node to the buttonElement

                    // Insert the 'ctaButton' element at the calculated position
                    model.insertContent(buttonElement, positionAfterCurrentBlock);
                });
            });

            return view;
        });
    }

    _defineSchema() {
        const schema = this.editor.model.schema;
    
        schema.register('ctaButton', {
            allowWhere: '$block', // Allow where block elements (e.g. paragraphs) are allowed
            isBlock: true,
            isObject: true, // Required to make the whole block selectable (to delete) and the text content non-editable
            allowContentOf: '$text',
            allowIn: '$root',
            allowAttributes: ['id', 'classes', 'onclick']
        });
    }
    
    _defineConverters() {
        const editor = this.editor;
    
        // Model -> Editing view
        editor.conversion.for('editingDowncast').elementToElement({
            model: 'ctaButton',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'cta-button'
                });
    
                // Enable the widget handling on a div element inside the editing view.
                // Note: toWidgetEditable removes the block level enter icons
                // FIXME you can still backspace the final character for some reason
                return toWidget(div, viewWriter, 'div');
            }
        });
    
        // Model -> Data view
        editor.conversion.for('dataDowncast').elementToElement({
            model: 'ctaButton',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'cta-button',
                    onclick: "window.location.href='https://www.google.com';"
                });
                return div;
            }
        });
    
        // Editing view -> model
        editor.conversion.for('upcast').elementToElement({
            view: {
                name: 'div',
                class: 'cta-button'
            },
            model: (viewElement, { writer: modelWriter }) => {
                const ctaButton = modelWriter.createElement('ctaButton');

                // Map the text nodes from the view to the model (not entirely sure why this is necessary)
                const innerText = viewElement.getChild(0).data;
                const textNode = modelWriter.createText(innerText);
                modelWriter.append(textNode, ctaButton);

                return ctaButton;
            }
        })
    }
}