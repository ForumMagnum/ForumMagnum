import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import { viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';

import InsertButtonCommand from './insertButtonCommand';
import './theme/customButton.css';
import { BUTTON_ELEMENT } from './constants';
import { INSERT_BUTTON_COMMAND } from './constants';
import { BUTTON_CLASS } from './constants';

export default class ButtonEditing extends Plugin {
  static get requires() {
    return [ Widget ];
  }

  init() {
    const { schema } = this.editor.model;
    const { conversion } = this.editor;
    schema.register(BUTTON_ELEMENT, {
      isBlock: true,
      isObject: true,
      allowIn: '$root',
      allowAttributes: [
        'data-button',
        'data-text',
        'data-href',
				'data-alignment',
      ],
    });

    conversion.for('editingDowncast').elementToElement({
      model: BUTTON_ELEMENT,
      view: (modelElement, { writer }) => {
        const container = writer.createContainerElement('div', {
					'data-button': true,
          'data-text': modelElement.getAttribute('data-text'),
          'data-href': modelElement.getAttribute('data-href'),
          'data-alignment': modelElement.getAttribute('data-alignment'),
					style: `text-align: ${modelElement.getAttribute('data-alignment')}`
				});
        const button = writer.createContainerElement('span', {
          class: BUTTON_CLASS
        });
        const text = writer.createText(modelElement.getAttribute('data-text'));
        writer.insert(writer.createPositionAt(button, 0), text);
        writer.insert(writer.createPositionAt(container, 0), button);
        return toWidget(container, writer);
      }
    });

    conversion.for('dataDowncast').elementToElement({
      model: BUTTON_ELEMENT,
      view: (modelElement, { writer }) => {
        const container = writer.createContainerElement('div', {
          'data-button': true,
          'data-text': modelElement.getAttribute('data-text'),
          'data-href': modelElement.getAttribute('data-href'),
          'data-alignment': modelElement.getAttribute('data-alignment'),
          style: `text-align: ${modelElement.getAttribute('data-alignment')}`
        });
        const button = writer.createContainerElement('a', {
          class: BUTTON_CLASS,
          href: modelElement.getAttribute('data-href'), // TODO: sanitize?
        });
        const text = writer.createText(modelElement.getAttribute('data-text'));
        writer.insert(writer.createPositionAt(button, 0), text);
        writer.insert(writer.createPositionAt(container, 0), button);
        return container;
      }
    });

    conversion.for('upcast').elementToElement({
      view: {
        attributes: {
          'data-button': true,
        },
      },
      model: ( viewElement, { writer } ) => {
        return writer.createElement(BUTTON_ELEMENT, {
          'data-text': viewElement.getAttribute('data-text'),
          'data-href': viewElement.getAttribute('data-href'),
          'data-alignment': viewElement.getAttribute('data-alignment')
        });
      }
    });

    // The following callbacks are needed to map nonempty view elements
    // to empty model elements. See https://ckeditor.com/docs/ckeditor5/latest/api/module_widget_utils.html#function-viewToModelPositionOutsideModelElement
    this.editor.editing.mapper.on(
      'viewToModelPosition',
      // @ts-ignore -- the type signature of `on` here seem to be just wrong, given how it's used in the source code.
      viewToModelPositionOutsideModelElement(this.editor.model, viewElement => viewElement.hasAttribute('data-button'))
    );

    this.editor.commands.add( INSERT_BUTTON_COMMAND, new InsertButtonCommand( this.editor ) );
  }
}
