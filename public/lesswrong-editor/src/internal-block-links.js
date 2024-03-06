import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class InternalBlockLinks extends Plugin {
  init() {
    const editor = this.editor;

    // Extend the schema for block elements to allow a `data-internal-id` attribute
    editor.model.schema.extend('$block', {
      allowAttributes: ['data-internal-id']
    });

    // Define the upcast converter for elements with a `data-internal-id`
    editor.conversion.for('upcast').attributeToAttribute({
      view: 'data-internal-id',
      model: 'data-internal-id'
    });

    // (model → data view)
    editor.conversion.for('dataDowncast').attributeToAttribute({
      model: 'data-internal-id',
      view: 'data-internal-id'
    });

    // (model → editing view)
    editor.conversion.for('editingDowncast').attributeToAttribute({
      model: 'data-internal-id',
      view: 'data-internal-id'
    });
  }
}