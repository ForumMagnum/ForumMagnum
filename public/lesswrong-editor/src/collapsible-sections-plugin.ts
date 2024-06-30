import { Command, Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Widget, toWidgetEditable, toWidget } from '@ckeditor/ckeditor5-widget';
import collapsibleSectionIcon from './collapsible-section-icon.svg';

/**
 * CkEditor5 plugin that makes a collapsible section, using the html <details>
 * element. This is somewhat similar to the SimpleBox plugin from the CkEditor
 * plugin documentation:
 *     https://ckeditor.com/docs/ckeditor5/latest/tutorials/widgets/implementing-a-block-widget.html
 *
 * For styling, see `collapsibleSectionStyles` in `stylePiping.ts`.
 *
 * This has two different DOM representations depending whether you're editing
 * or not, because in the editor you want click-events to be handled differently
 * (so that you can click on text to place the cursor in it, without it
 * collapsing the section).
 *
 * In the data representation (which is what's used on post-pages), a
 * collapsible section looks like:
 *
 *   <details class="detailsBlock">
 *     <summary class="detailsBlockTitle">
 *       [title]
 *     </summary>
 *     <p class="detailsBlockContent">
 *       [contents]
 *     </p>
 *   </details>
 *
 * In the editing representation, it looks like:
 *
 *   <div class="detailsBlock detailsBlockEdit">
 *     <div class="detailsBlockTitle">
 *       [title]
 *     </div>
 *     <p class="detailsBlockContent">
 *       [contents]
 *     </p>
 *   </div>
 *
 * To collapse the block in editing mode, a global event handler checks whether
 * a click is on a non-text part of detailsBlockEdit>detailsBlockTitle, and if
 * so, toggles the detailsBlockClosed class on detailsBlockEdit.
 */
export default class CollapsibleSections extends Plugin {
  static get requires() {
    return [ Widget ];
  }

  init() {
    this._defineSchema();
    this._defineConverters();
    this.editor.commands.add('insertCollapsibleSection', new InsertCollapsibleSectionCommand(this.editor));
    
    this.editor.ui.componentFactory.add('collapsibleSectionButton', (locale) => {
      // The state of the button will be bound to the widget command.
      const command = this.editor.commands.get('insertCollapsibleSection');

      // The button will be an instance of ButtonView.
      const buttonView = new ButtonView(locale);

      buttonView.set({
        // The t() function helps localize the editor. All strings enclosed in t() can be
        // translated and change when the language of the editor changes.
        label: 'Collapsible Section',
        icon: collapsibleSectionIcon,
        tooltip: true
      });

      // Bind the state of the button to the command.
      buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

      // Execute the command when the button is clicked (executed).
      this.listenTo(buttonView, 'execute', () => this.editor.execute('insertCollapsibleSection'));

      return buttonView;
    });
  }
  
  _defineSchema() {
    const schema = this.editor.model.schema;
    
    schema.register('collapsibleSection', {
      allowWhere: '$block',
      allowContentOf: ['collapsibleSectionTitle', 'collapsibleSectionContent'],
      //allowContentOf: '$block',
    });
    
    schema.register('collapsibleSectionTitle', {
      isLimit: true,
      allowIn: 'collapsibleSection',
      allowContentOf: '$root',
    });

    schema.register('collapsibleSectionContent', {
      isLimit: true,
      allowIn: 'collapsibleSection',
      allowContentOf: '$root',
    });
  }
  
  _defineConverters() {
    const conversion = this.editor.conversion;

    conversion.for('upcast').elementToElement({
      model: (viewElement, {writer}) => writer.createElement('collapsibleSection'),
      view: {name: "div", classes: "detailsBlock"},
    });
    conversion.for("dataDowncast").elementToElement({
      model: "collapsibleSection",
      view: {name: "details", classes: "detailsBlock"},
    });
    conversion.for('upcast').elementToElement({
      model: (viewElement, {writer}) => writer.createElement('collapsibleSection'),
      view: {name: "details", classes: "detailsBlock"},
    });
    conversion.for("editingDowncast").elementToElement({
      model: "collapsibleSection",
      view: ( modelElement, { writer: viewWriter } ) => {
        //const collapsibleSection = viewWriter.createContainerElement('div', { class: 'detailsBlock detailsBlockEdit' });
        const collapsibleSection = viewWriter.createContainerElement('div', { class: 'detailsBlock' });
        
        // This uses `toWidgetEditable` rather than `toWidget`. It's the parent
        // of two editable elements (collapsibleSectionTitle and
        // collapsibleSectionContent) without being properly editable itself;
        // but empirically, the UI works with toWidgetEditable and is broken if
        // we use toWidget. Specifically, with toWidget, CkEditor attaches a
        // bunch of event handling for manipulating the block as a unit (as one
        // would eg an image), which take precedence over the inner editables.
        //
        // It's technically possible to make a malformed details block this way,
        // by range-selecting and deleting the title and leaving the contents,
        // or vise versa.
        return toWidgetEditable(collapsibleSection, viewWriter, { label: 'collapsible section' });
      }
    });

    conversion.for('upcast').elementToElement({
      model: (viewElement, {writer}) => writer.createElement('collapsibleSectionTitle'),
      view: {name: "summary", classes: "detailsBlockTitle"},
    });
    conversion.for("dataDowncast").elementToElement({
      model: "collapsibleSectionTitle",
      view: {name: "summary", classes: "detailsBlockTitle"},
    });
    conversion.for('upcast').elementToElement({
      model: (viewElement, {writer}) => writer.createElement('collapsibleSectionTitle'),
      view: {name: "div", classes: "detailsBlockTitle"},
    });
    conversion.for("editingDowncast").elementToElement({
      model: "collapsibleSectionTitle",
      view: (modelElement, { writer: viewWriter }) => {
        const collapsibleSectionTitle = viewWriter.createContainerElement('div', { class: 'detailsBlockTitle' });
        return toWidgetEditable(collapsibleSectionTitle, viewWriter, { label: 'details' });
      }
    });

    const collapsibleSectionContentView = {
      name: "div",
      classes: "detailsBlockContent"
    };
    conversion.for('upcast').elementToElement({
      model: (viewElement, {writer}) => writer.createElement('collapsibleSectionContent'),
      view: collapsibleSectionContentView,
    });
    conversion.for("dataDowncast").elementToElement({
      model: "collapsibleSectionContent",
      view: collapsibleSectionContentView,
    });
    conversion.for("editingDowncast").elementToElement({
      model: "collapsibleSectionContent",
      view: (modelElement, { writer: viewWriter }) => {
        const collapsibleSectionContent = viewWriter.createContainerElement('div', { class: 'detailsBlockContent' });
        return toWidgetEditable(collapsibleSectionContent, viewWriter, { label: 'contents' });
      }
    });
  }
}

class InsertCollapsibleSectionCommand extends Command {
  execute() {
    const model = this.editor.model;
    model.change(writer => {
      const selection = model.document.selection;
      const currentElement = selection.getFirstPosition().parent;
      const insertPosition = (currentElement.childCount > 0)
        ? writer.createPositionAfter(currentElement)
        : writer.createPositionAt(currentElement, 0);
      if (!insertPosition) throw new Error("Invalid insert position");
      model.insertContent(createCollapsibleSection(writer), insertPosition);
    });
  }
  
  refresh() {
    const model = this.editor.model;
    const lastPosition = model.document.selection.getLastPosition();
    const allowedIn = lastPosition && model.schema.findAllowedParent(lastPosition, 'collapsibleSection');

    this.isEnabled = allowedIn !== null;
  }
}

function createCollapsibleSection(writer) {
  const collapsibleSection = writer.createElement('collapsibleSection');
  const collapsibleSectionTitle = writer.createElement('collapsibleSectionTitle');
  const collapsibleSectionContent = writer.createElement('collapsibleSectionContent');

  writer.append(collapsibleSectionTitle, collapsibleSection);
  writer.append(collapsibleSectionContent, collapsibleSection);

  //writer.appendElement('paragraph', collapsibleSectionTitle);
  writer.appendElement('paragraph', collapsibleSectionContent);

  return collapsibleSection;
}

