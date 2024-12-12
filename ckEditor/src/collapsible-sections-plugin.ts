import { Command, Plugin } from '@ckeditor/ckeditor5-core';
import { type DowncastConversionApi, type Element, type Writer } from '@ckeditor/ckeditor5-engine';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Widget, toWidgetEditable, toWidget } from '@ckeditor/ckeditor5-widget';
import collapsibleSectionIcon from './ckeditor5-collapsible-section-icon.svg';

/**
 * CkEditor5 plugin that makes a collapsible section, using the html <details>
 * element. This is somewhat similar to the SimpleBox plugin from the CkEditor
 * plugin documentation:
 *     https://ckeditor.com/docs/ckeditor5/latest/framework/tutorials/widgets/implementing-a-block-widget.html
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
 *     <div class="detailsBlockContent">
 *       [contents]
 *     </div>
 *   </details>
 *
 * In the editing representation, it looks like:
 *
 *   <div class="detailsBlock detailsBlockEdit">
 *     <div class="detailsBlockTitle">
 *       [title]
 *     </div>
 *     <div class="detailsBlockContent">
 *       [contents]
 *     </div>
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
    this._registerPostFixer();
    this._defineConverters();
    this.editor.commands.add('insertCollapsibleSection', new InsertCollapsibleSectionCommand(this.editor));
    
    this.editor.ui.componentFactory.add('collapsibleSectionButton', (locale) => {
      // The state of the button will be bound to the widget command.
      const command: InsertCollapsibleSectionCommand = this.editor.commands.get('insertCollapsibleSection');

      // The button will be an instance of ButtonView.
      const buttonView = new ButtonView(locale);

      buttonView.set({
        // The t() function helps localize the editor. All strings enclosed in t() can be
        // translated and change when the language of the editor changes.
        label: 'Collapsible Section',
        icon: collapsibleSectionIcon,
        tooltip: true
      });

      // Execute the command when the button is clicked (executed).
      this.listenTo(buttonView, 'execute', () => this.editor.execute('insertCollapsibleSection'));

      return buttonView;
    });
  }
  
  private _defineSchema() {
    const schema = this.editor.model.schema;
    
    schema.register('collapsibleSection', {
      allowWhere: '$block',
      allowContentOf: '$root',
    });
  }
  
  private _defineConverters() {
    const conversion = this.editor.conversion;

    // collapsibleSection
    conversion.for('upcast').elementToElement({
      model: (viewElement, {writer}) => writer.createElement('collapsibleSection'),
      view: {name: "div", classes: "detailsBlock"},
    });
    conversion.for('upcast').elementToElement({
      model: (viewElement, {writer}) => writer.createElement('collapsibleSection'),
      view: {name: "details", classes: "detailsBlock"},
    });
    
    conversion.for('editingDowncast').elementToStructure({
      model: {
        name: "collapsibleSection",
      },
      view: (modelElement: Element, conversionApi: DowncastConversionApi) => {
        const { writer } = conversionApi;
        const collapsibleSectionElement = writer.createEditableElement('div', { class: 'detailsBlock detailsBlockEdit' });
        const titleElement = conversionApi.writer.createEditableElement('div', { class: "detailsBlockTitle" });
        const detailsElement = writer.createEditableElement('div', { class: "detailsBlockContent" });
        writer.insert(writer.createPositionAt(collapsibleSectionElement, 0), titleElement);
        writer.insert(writer.createPositionAfter(titleElement), detailsElement);
        
        const titleSlot = writer.createSlot(node => node.index === 0);
        writer.insert(writer.createPositionAt(titleElement, 0), titleSlot);

        const detailsSlot = writer.createSlot(node => node.index > 0);
        writer.insert(writer.createPositionAt(detailsElement, 0), detailsSlot);
        
        return collapsibleSectionElement;
      }
    });

    conversion.for('dataDowncast').elementToStructure({
      model: {
        name: "collapsibleSection",
      },
      view: (modelElement: Element, conversionApi: DowncastConversionApi) => {
        const { writer } = conversionApi;
        const collapsibleSectionElement = writer.createEditableElement('details', { class: 'detailsBlock' });
        const titleElement = conversionApi.writer.createEditableElement('summary', { class: "detailsBlockTitle" });
        const detailsElement = writer.createEditableElement('div', { class: "detailsBlockContent" });
        writer.insert(writer.createPositionAt(collapsibleSectionElement, 0), titleElement);
        writer.insert(writer.createPositionAfter(titleElement), detailsElement);
        
        const titleSlot = writer.createSlot(node => node.index === 0);
        writer.insert(writer.createPositionAt(titleElement, 0), titleSlot);

        const detailsSlot = writer.createSlot(node => node.index > 0);
        writer.insert(writer.createPositionAt(detailsElement, 0), detailsSlot);
        
        return collapsibleSectionElement;
      }
    });
  }
  
  private _registerPostFixer() {
    const editor = this.editor;
    const model = editor.model;

    // Check whether the last element in the page is a collapsibleSection. If
    // so, insert an empty paragraph after it. This ensures that you'll be able
    // to place the cursor below the collapsibleSection.
    model.document.registerPostFixer(writer => {
      const root = model.document.getRoot();
      const lastChild = root.getChild(root.childCount - 1);
    
      if (lastChild.is('element', 'collapsibleSection')) {
        const paragraph = writer.createElement('paragraph');
        writer.insert(paragraph, root, 'end');
        return true;
      }
    
      return false;
    });
  }
}

export class InsertCollapsibleSectionCommand extends Command {
  execute() {
    const model = this.editor.model;
    model.change(writer => {
      const selection = model.document.selection;
      const currentElement = selection.getFirstPosition().parent as Element;
      const insertPosition = (currentElement.childCount > 0)
        ? writer.createPositionAfter(currentElement)
        : writer.createPositionAt(currentElement, 0);
      if (!insertPosition) throw new Error("Invalid insert position");
      
      const { collapsibleSection, collapsibleSectionTitle } = createCollapsibleSection(writer)
      model.insertContent(collapsibleSection, insertPosition);
      //writer.insert(collapsibleSection, insertPosition);
      const newCursor = writer.createPositionAt(collapsibleSectionTitle, 0);
      writer.setSelection(newCursor);
    });
  }
  
  refresh() {
    const model = this.editor.model;
    const lastPosition = model.document.selection.getLastPosition();
    const allowedIn = lastPosition && model.schema.findAllowedParent(lastPosition, 'collapsibleSection');

    this.isEnabled = allowedIn !== null;
  }
}

function createCollapsibleSection(writer: Writer): {
  collapsibleSection: Element
  collapsibleSectionTitle: Element
} {
  const collapsibleSection = writer.createElement('collapsibleSection');
  const title = writer.createElement('paragraph');
  const details = writer.createElement('paragraph');
  writer.append(title, collapsibleSection);
  writer.append(details, collapsibleSection);

  return {
    collapsibleSection,
    collapsibleSectionTitle: title,
  };
}
