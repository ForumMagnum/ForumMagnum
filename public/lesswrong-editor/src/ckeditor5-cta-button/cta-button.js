import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';

// What parameters need to be set:
// - Text (regular text node)
// - Link (literally an href)
// - Alignment (a class)
//
// What should the resulting element be?:
// - A div throughout, because of the double upcasting issue with <a>s

const CTA_CLASS = "ck-cta-button";
const CENTERED_CLASS = "ck-cta-button-centered";

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
                    let insertPosition;

                    // Check if the current block has any content
                    if (currentElement.childCount > 0) {
                        // If there is content, insert after the current block
                        insertPosition = writer.createPositionAfter(currentElement);
                    } else {
                        // If there is no content, use the current block itself
                        insertPosition = writer.createPositionAt(currentElement, 0);
                    }

                    const buttonElement = writer.createElement('ctaButton');
                    const buttonText = writer.createText('Apply now');
                    writer.append(buttonText, buttonElement);

                    // Set the href attribute for the buttonElement
                    writer.setAttribute('href', 'https://google.com', buttonElement);
                    // Set it to be centered by default
                    writer.setAttribute('class', CENTERED_CLASS, buttonElement);

                    // Insert the 'ctaButton' element at the calculated position
                    model.insertContent(buttonElement, insertPosition);
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
            allowAttributes: ['id', 'class', 'href']
        });
    }
    
    _defineConverters() {
        const editor = this.editor;
    
        // Model -> Editing view
        editor.conversion.for('editingDowncast').elementToElement({
            model: 'ctaButton',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement("div", {
                    // Add any classes from the model (ck-cta-button itself is not included on the model)
					class: [CTA_CLASS, ...(modelElement.getAttribute("class") || "").split(" ")].join(" "),
					href: modelElement.getAttribute("href") || "",
				});

                return toWidget(div, viewWriter, 'div');
            }
        });
    
        // Model -> Data view
        editor.conversion.for('dataDowncast').elementToElement({
            model: 'ctaButton',
            view: (modelElement, { writer: viewWriter }) => {
                // Note: I'm using a div rather than a plain <a> element because the
                // href on the <a> element appears to also get picked up by another plugin which
                // breaks things. I'm also using a div instead of a <button> to simplify what we
                // allow in `sanitize()` (see packages/lesswrong/lib/vulcan-lib/utils.ts)
                const div = viewWriter.createContainerElement('div', {
                    // Add any classes from the model (ck-cta-button itself is not included on the model)
                    class: [CTA_CLASS, ...(modelElement.getAttribute("class") || "").split(" ")].join(" "),
                    'data-href': modelElement.getAttribute('href') || ''
                });
                return div;
            }
        });
    
        // Editing view -> model
        editor.conversion.for('upcast').elementToElement({
            view: {
                name: 'div',
                classes: 'ck-cta-button',
            },
            model: (viewElement, { writer: modelWriter }) => {
                const ctaButton = modelWriter.createElement('ctaButton');
                modelWriter.setAttribute('href', viewElement.getAttribute('data-href') || '', ctaButton);

                const viewClass = viewElement.getAttribute('class')
                if (viewClass.includes(CENTERED_CLASS)) {
                    modelWriter.setAttribute('class', CENTERED_CLASS, ctaButton);
                }

                // Map the text nodes from the view to the model
                const innerText = viewElement.getChild(0).data;
                const textNode = modelWriter.createText(innerText);
                modelWriter.append(textNode, ctaButton);

                return ctaButton;
            },
        })
    }
}