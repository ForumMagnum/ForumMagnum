import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';

export default class CTAButton extends Plugin {
    static get requires() {
        return [ Widget ];
    }

    init() {
        const editor = this.editor;

        editor.model.schema.register('ctaButton', {
            allowWhere: '$block',
            isBlock: true,
            allowContentOf: '$text',
            allowIn: [ '$root', '$block' ]
        });

        // Editing downcast conversion: model 'ctaButton' to a 'div' in the editing view
        editor.conversion.for('editingDowncast').elementToElement({
            model: 'ctaButton',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createEditableElement('div', {
                    class: 'cta-button'
                });
                const innerText = viewWriter.createText('Hello world');
                viewWriter.insert(viewWriter.createPositionAt(div, 0), innerText);
                return toWidget(div, viewWriter, { label: 'CTA button widget' });
            }
        });

        // Data downcast conversion: model 'ctaButton' to a 'div' in the data view
        editor.conversion.for('dataDowncast').elementToElement({
            model: 'ctaButton',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'cta-button'
                });
                const innerText = viewWriter.createText('Hello world');
                viewWriter.insert(viewWriter.createPositionAt(div, 0), innerText);
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
                const modelElement = modelWriter.createElement('ctaButton');
                // Transfer the text from the view to the model.
                // const text = 'Hello world';
                // const textNode = modelWriter.createText(text);
                modelWriter.append(textNode, modelElement);
                return modelElement;
            }
        });

        editor.ui.componentFactory.add('ctaButtonToolbarItem', locale => {
            const view = new ButtonView(locale);

            view.set({
                label: 'Insert CTA Button',
                withText: true,
                tooltip: true
            });

            view.on('execute', () => {
                const model = editor.model;
                const selection = model.document.selection;

                model.change(writer => {
                    const buttonElement = writer.createElement('ctaButton');
                    model.insertContent(buttonElement, selection.getFirstPosition());
                });
            });

            return view;
        });
    }
}