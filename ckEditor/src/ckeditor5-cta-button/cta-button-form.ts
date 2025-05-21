import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ClickObserver from "@ckeditor/ckeditor5-engine/src/view/observer/clickobserver";
import ContextualBalloon from "@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon";
import clickOutsideHandler from "@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler";

import View from "@ckeditor/ckeditor5-ui/src/view";
import ViewCollection from "@ckeditor/ckeditor5-ui/src/viewcollection";
import InputTextView from "@ckeditor/ckeditor5-ui/src/inputtext/inputtextview";

import KeystrokeHandler from "@ckeditor/ckeditor5-utils/src/keystrokehandler";
import FocusTracker from "@ckeditor/ckeditor5-utils/src/focustracker";
import FocusCycler from "@ckeditor/ckeditor5-ui/src/focuscycler";

import type { Editor } from "@ckeditor/ckeditor5-core";
import type { Locale } from "@ckeditor/ckeditor5-utils";
import type { Element } from "@ckeditor/ckeditor5-engine";
import type Writer from "@ckeditor/ckeditor5-engine/src/model/writer";

import submitHandler from "@ckeditor/ckeditor5-ui/src/bindings/submithandler";

import './ctaform.css';
import { validateUrl } from "../url-validator-utils";

class MainFormView extends View {
  editor: Editor
  selectedElement: AnyBecauseTodo
  buttonTextView: AnyBecauseTodo
  linkToView: AnyBecauseTodo
  previewEnabled: AnyBecauseTodo
  _focusables: AnyBecauseTodo
  focusTracker: AnyBecauseTodo
  keystrokes: KeystrokeHandler
  _focusCycler: FocusCycler
  label: AnyBecauseTodo
  locale: Locale

  constructor(locale: Locale, editor: Editor) {
    super(locale);

    this.editor = editor;
    this._createKeyAndFocusTrackers();

    // selectedElement will be set to the button that is clicked on (there can be multiple in the same editor)
    this.selectedElement = null;

    const { buttonTextView, linkToView } = this._createInputs();
    this.buttonTextView = buttonTextView;
    this.linkToView = linkToView;

    this.previewEnabled = true;

    // Add UI elements to template
    this.setTemplate({
      tag: "form",
      attributes: {
        class: ["ck", "ck-cta-form"],
        tabindex: "-1",
        spellcheck: "false",
      },
      children: [
        {
          tag: "div",
          children: [
            {
              tag: "div",
              attributes: {
                class: ["ck-cta-form-label"],
              },
              children: ["Button text"],
            },
            buttonTextView
          ]
        },
        {
          tag: "div",
          children: [
            {
              tag: "div",
              attributes: {
                class: ["ck-cta-form-label"],
              },
              children: ["Link to"],
            },
            linkToView
          ]
        }
      ],
    });
  }

  onClose() {
    this.linkToView.element.classList.remove('ck-cta-error');
  }

  render() {
    super.render();

    // Prevent default form submit event & trigger custom 'submit'
    submitHandler({
      view: this,
    });

    // Register form elements to focusable elements
    const childViews = [this.buttonTextView, this.linkToView];

    childViews.forEach((v) => {
      this._focusables.add(v);
      this.focusTracker.add(v.element);
    });

    // Listen to keypresses inside form element
    this.keystrokes.listenTo(this.element);
  }

  focus() {
    this._focusCycler.focusFirst();
  }

  _createKeyAndFocusTrackers() {
    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();
    this._focusables = new ViewCollection();

    this._focusCycler = new FocusCycler({
      focusables: this._focusables,
      focusTracker: this.focusTracker,
      keystrokeHandler: this.keystrokes,
      actions: {
        focusPrevious: "shift + tab",
        focusNext: "tab",
      },
    });
  }

  get buttonText() {
    return this.buttonTextView.element.value;
  }

  set buttonText(value) {
    this.buttonTextView.element.value = value;
  }

  get linkTo() {
    return this.linkToView.element.value;
  }

  set linkTo(value) {
    this.linkToView.element.value = value;
  }

  _createInputs() {
    // Create 'Button text' input
    const buttonTextView = new InputTextView(this.locale);
    const buttonTextBind = buttonTextView.bindTemplate;
    buttonTextView.setTemplate({
      tag: "input",
      attributes: {
        type: "text",
        class: ["ck-cta-form-input", buttonTextBind.if("hasError", "ck-error")],
        id: buttonTextBind.to("id"),
        placeholder: buttonTextBind.to("placeholder"),
        readonly: false,
        "aria-invalid": buttonTextBind.if("hasError", true),
        "aria-describedby": buttonTextBind.to("ariaDescribedById"),
      },
      on: {
        input: buttonTextBind.to("input"),
      },
    });
    (buttonTextView as AnyBecauseTodo).label = "Button text";
    buttonTextView.on("input", () => {
      const model = this.editor.model;
      const selectedElement = this.selectedElement;

      model.change((writer: Writer) => {
        if (!selectedElement) return;

        const inputValue = buttonTextView.element.value.trim();

        // Remove the existing text nodes within the selected element
        const range = writer.createRangeIn(selectedElement);
        writer.remove(range);

        // Insert the new text node with the input value
        const newText = writer.createText(inputValue);
        writer.insert(newText, writer.createPositionAt(selectedElement, 0));
      });
    });

    // Create 'Link to' input
    const linkToView = new InputTextView(this.locale);
    const linkToBind = linkToView.bindTemplate;
    linkToView.setTemplate({
      tag: "input",
      attributes: {
        type: "text",
        class: ["ck-cta-form-input", linkToBind.if("hasError", "ck-error")],
        id: linkToBind.to("id"),
        placeholder: 'https://example.com',
        readonly: false,
        "aria-invalid": linkToBind.if("hasError", true),
        "aria-describedby": linkToBind.to("ariaDescribedById"),
      },
      on: {
        input: linkToBind.to("input"),
      },
    });
    (linkToView as AnyBecauseTodo).label = "Link to";
    linkToView.on("input", () => {
      const model = this.editor.model;
      const selectedElement = this.selectedElement;

      model.change((writer: Writer) => {
        if (!selectedElement) return;

        const inputValue = linkToView.element.value.trim();
        try {
          // Validate in strict mode, so an error is thrown if it can't be coerced into a valid url
          const cleanUrl = validateUrl(inputValue, true);

          linkToView.element.classList.toggle('ck-cta-error', false);

          writer.setAttribute("href", cleanUrl, selectedElement);
        } catch (e) {
          // Update the UI to reflect whether the URL is valid or not
          linkToView.element.classList.toggle('ck-cta-error', true);
          writer.setAttribute("href", '', selectedElement);
        }
      });
    });

    return {
      buttonTextView,
      linkToView,
    };
  }
}

/**
 * Plugin for the form to edit the text and link of a CTA button
 */
export default class CTAButtonForm extends Plugin {
  formView: AnyBecauseTodo
  _balloon: AnyBecauseTodo

  static get requires() {
    return [ContextualBalloon];
  }

  static get pluginName() {
    return "CTAButtonForm";
  }

  init() {
    const editor = this.editor;
    editor.editing.view.addObserver(ClickObserver);

    this.formView = this._createFormView();

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

  _createFormView() {
    const editor = this.editor;

    const formView = new MainFormView(editor.locale, editor);

    // Close plugin ui, if esc is pressed (while ui is focused)
    formView.keystrokes.set("esc", (_, cancel: () => void) => {
      this.formView.fire("submit");
      this._closeFormView();
    });

    // Cycle to the next input on enter, unless this is the last input in which case close
    formView.keystrokes.set("Enter", (_, cancel: () => void) => {
      if (document.activeElement === formView.linkToView.element) {
        this.formView.fire("submit");
        this._closeFormView();
      } else {
        this.formView._focusCycler.focusNext();
        cancel();
      }
    });

    return formView;
  }

  _addFormView(selectedElement: Element) {
    if (this._isFormInPanel) {
      return;
    }

    this._balloon.add({
      view: this.formView,
      position: this._getBalloonPositionData(),
      balloonClassName: "ck-cta-balloon",
    });

    this.formView.buttonTextView.select();
    this.formView.selectedElement = selectedElement;

    // Set buttonText to the text content of selectedElement
    const buttonText = (selectedElement.getChild(0) as AnyBecauseTodo).data;
    this.formView.buttonText = buttonText;

    // Set linkTo to the 'data-href' attribute of the selectedElement
    const linkTo = selectedElement.getAttribute("href") || '';
    this.formView.linkTo = linkTo;
  }

  _closeFormView() {
    if (!this._isFormInPanel) {
      return;
    }

    const editor = this.editor;

    this.stopListening(editor.ui, "update");
    this.stopListening(this._balloon, "change:visibleView");

    editor.editing.view.focus();

    if (this._isFormInPanel) {
      this._balloon.remove(this.formView);

      this.editor.editing.view.focus();
    }

    this.formView.onClose()
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

    // Close on click outside of balloon panel element
    clickOutsideHandler({
      emitter: this.formView,
      activator: () => true,
      contextElements: [this._balloon.view.element],
      callback: () => this._closeFormView(),
    });
  }

  get _isFormInPanel() {
    return this._balloon.hasView(this.formView);
  }
}
