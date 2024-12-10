import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ClickObserver from "@ckeditor/ckeditor5-engine/src/view/observer/clickobserver";
import ContextualBalloon from "@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon";
import clickOutsideHandler from "@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler";

import View from "@ckeditor/ckeditor5-ui/src/view";

import KeystrokeHandler from "@ckeditor/ckeditor5-utils/src/keystrokehandler";
import FocusCycler from "@ckeditor/ckeditor5-ui/src/focuscycler";

import type { Editor } from "@ckeditor/ckeditor5-core";
import type { Locale } from "@ckeditor/ckeditor5-utils";
import type { Element } from "@ckeditor/ckeditor5-engine";


import './ctaform.css';
import type { CTAButtonPluginConfiguration, CTAButtonSettings } from '../../../packages/lesswrong/components/editor/ctaButton/ctaButton';

class MainFormView extends View {
  editor: Editor
  selectedElement: AnyBecauseTodo
  buttonTextView: AnyBecauseTodo
  linkToView: AnyBecauseTodo
  keystrokes: KeystrokeHandler
  _focusCycler: FocusCycler
  label: AnyBecauseTodo
  locale: Locale

  constructor(locale: Locale, editor: Editor) {
    super(locale);
    this.editor = editor;

    // Add UI elements to template
    this.setTemplate({
      tag: "form",
      attributes: {
        class: ["ck", "ck-cta-form"],
        tabindex: "-1",
        spellcheck: "false",
      },
    });
  }

  render() {
    super.render();
    const config = this.editor.config.get('ctaButton') as CTAButtonPluginConfiguration;
    const initialState: CTAButtonSettings = {buttonText: "asdf", linkTo: "1234"}; //TODO
    const setDocumentState =  (newState: CTAButtonSettings) => {}; //TODO
    config.renderCTAButtonSettingsInto(this.element, initialState, setDocumentState);
  }
}

/**
 * Plugin for the form to edit the text and link of a CTA button
 */
export default class CTAButtonForm extends Plugin {
  formView: MainFormView
  _balloon: ContextualBalloon

  static get requires() {
    return [ContextualBalloon];
  }

  static get pluginName() {
    return "CTAButtonForm";
  }

  init() {
    const editor = this.editor;
    editor.editing.view.addObserver(ClickObserver);

    this._balloon = editor.plugins.get(ContextualBalloon);
    this._enableUserBalloonInteractions();
  }

  destroy() {
    super.destroy();
    this.formView.destroy();
  }

  _showUI(selectedElement: Element) {
    this._addFormView(selectedElement);
    this._balloon.showStack("main");
  }

  _addFormView(selectedElement: Element) {
    if (this.formView) {
      return;
    }

    const editor = this.editor;
    this.formView = new MainFormView(editor.locale, editor);
    this._balloon.add({
      view: this.formView,
      position: this._getBalloonPositionData(),
      balloonClassName: "ck-cta-balloon",
    });

    // Close on click outside of balloon panel element
    clickOutsideHandler({
      emitter: this.formView,
      activator: () => true,
      contextElements: [this._balloon.view.element],
      callback: () => this._closeFormView(),
    });
  }

  _closeFormView() {
    if (!this.formView) {
      return;
    }

    const editor = this.editor;

    this.stopListening(editor.ui, "update");
    this.stopListening(this._balloon, "change:visibleView");

    editor.editing.view.focus();
    this._balloon.remove(this.formView);
    this.formView = null;
  }

  _getBalloonPositionData() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;
    const target = view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange());
    return { target };
  }

  /**
   * Check if the current selected element is a CTA button and return it if so
   */
  _getSelectedCTAButton() {
    const selection = this.editor.model.document.selection;
    const selectedElement = selection.getSelectedElement();
    if (selectedElement && selectedElement.is("element", "ctaButton")) {
      return selectedElement;
    }
    return null;
  }

  /**
   * Handle clicks to open and close the form view
   */
  _enableUserBalloonInteractions() {
    const viewDocument = this.editor.editing.view.document;

    // Show panel when a CTA button is clicked
    this.listenTo(viewDocument, "click", (evt, data) => {
      const selectedElement = this._getSelectedCTAButton();
      const domTarget = data.domTarget;
      // isTargetCTAButton is here to make clicking away to exit work better, because clicks not quite
      // on the button can select it
      const isTargetCTAButton = domTarget && domTarget.classList && domTarget.classList.contains('ck-cta-button');

      if (selectedElement && isTargetCTAButton) {
        this._showUI(selectedElement);
      }
    });
  }
}
