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

import './pollform.css';

class MainFormView extends View {
  editor: Editor
  selectedElement: AnyBecauseTodo
  questionView: AnyBecauseTodo
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

    this.selectedElement = null;

    const { questionView } = this._createInputs();
    this.questionView = questionView;

    this.previewEnabled = true;

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
              children: ["Question"],
            },
            questionView
          ]
        }
      ],
    });
  }

  onClose() {
    this.questionView.element.classList.remove('ck-cta-error');
  }

  render() {
    super.render();

    submitHandler({
      view: this,
    });

    const childViews = [this.questionView];

    childViews.forEach((v) => {
      this._focusables.add(v);
      this.focusTracker.add(v.element);
    });

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

  get question() {
    return this.questionView.element.value;
  }

  set question(value) {
    this.questionView.element.value = value;
  }

  _createInputs() {
    const questionView = new InputTextView(this.locale);
    const questionBind = questionView.bindTemplate;
    questionView.setTemplate({
      tag: "input",
      attributes: {
        type: "text",
        class: ["ck-cta-form-input", questionBind.if("hasError", "ck-error")],
        id: questionBind.to("id"),
        placeholder: questionBind.to("placeholder"),
        readonly: false,
        "aria-invalid": questionBind.if("hasError", true),
        "aria-describedby": questionBind.to("ariaDescribedById"),
      },
      on: {
        input: questionBind.to("input"),
      },
    });
    (questionView as AnyBecauseTodo).label = "Question";
    questionView.on("input", () => {
      const model = this.editor.model;
      const selectedElement = this.selectedElement;

      model.change((writer: Writer) => {
        if (!selectedElement) return;

        const inputValue = questionView.element.value.trim();

        const range = writer.createRangeIn(selectedElement);
        writer.remove(range);

        const newText = writer.createText(inputValue);
        writer.insert(newText, writer.createPositionAt(selectedElement, 0));
      });
    });

    return {
      questionView,
    };
  }
}

/**
 * Plugin for the form to edit the text and link of a CTA button
 */
export default class PollForm extends Plugin {
  formView: AnyBecauseTodo
  _balloon: AnyBecauseTodo

  static get requires() {
    return [ContextualBalloon];
  }

  static get pluginName() {
    return "PollForm";
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
      if (document.activeElement === formView.questionView.element) {
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

    this.formView.questionView.select();
    this.formView.selectedElement = selectedElement;

    // Set question to the text content of selectedElement
    const question = (selectedElement.getChild(0) as AnyBecauseTodo).data;
    this.formView.question = question;
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
    if (selectedElement && selectedElement.is("element", "poll")) {
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
      const isTargetCTAButton = domTarget && domTarget.classList && domTarget.classList.contains('ck-poll');

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
