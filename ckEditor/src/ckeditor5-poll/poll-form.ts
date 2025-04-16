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
import type { Element, RootElement } from "@ckeditor/ckeditor5-engine";
import type Writer from "@ckeditor/ckeditor5-engine/src/model/writer";

import submitHandler from "@ckeditor/ckeditor5-ui/src/bindings/submithandler";

import './poll.css';
import { POLL_CLASS, PollProps } from "./constants";

class MainFormView extends View {
  editor: Editor
  selectedElement: (Element | RootElement)
  questionView: AnyBecauseTodo
  agreeWordingView: AnyBecauseTodo
  disagreeWordingView: AnyBecauseTodo
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

    const { questionView, agreeWordingView, disagreeWordingView } = this._createInputs();
    this.questionView = questionView;
    this.agreeWordingView = agreeWordingView;
    this.disagreeWordingView = disagreeWordingView;

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
          attributes: {
            class: ["ck-cta-form-group"],
          },
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
        },
        {
          tag: "div",
          attributes: {
            class: ["ck-cta-form-row"],
          },
          children: [
            {
              tag: "div",
              attributes: {
                class: ["ck-cta-form-group"],
              },
              children: [
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-cta-form-label"],
                  },
                  children: ["Disagree wording"],
                },
                disagreeWordingView
              ]
            },
            {
              tag: "div",
              attributes: {
                class: ["ck-cta-form-group"],
              },
              children: [
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-cta-form-label"],
                  },
                  children: ["Agree wording"],
                },
                agreeWordingView
              ]
            },
          ]
        },
        {
          tag: "div",
          attributes: {
            class: ["ck-cta-form-row"],
          },
          children: [
            {
              tag: "div",
              attributes: {
                class: ["ck-cta-form-group"],
              },
              children: [
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-cta-form-label"],
                    style: "margin-bottom: 4px; font-weight: bold;"
                  },
                  children: ["Color"]
                },
                {
                  tag: "div",
                  attributes: {
                    style: "display: flex; align-items: center;"
                  },
                  children: [
                    {
                      tag: "div",
                      attributes: {
                        style: "background-color: #9f85cc; width: 20px; height: 20px; margin-right: 8px; cursor: pointer; border: 1px solid #ccc;"
                      }
                    },
                    {
                      tag: "div",
                      attributes: {
                        style: "background-color: #3185C4; width: 20px; height: 20px; margin-right: 8px; cursor: pointer; border: 1px solid #ccc;"
                      }
                    }
                  ]
                }
              ]
            },
            {
              tag: "div",
              attributes: {
                class: ["ck-cta-form-group"],
                style: "margin-left: 20px;"
              },
              children: [
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-cta-form-label"],
                    style: "margin-bottom: 4px; font-weight: bold;"
                  },
                  children: ["Duration"]
                },
                {
                  tag: "div",
                  attributes: {
                    style: "display: flex; align-items: center;"
                  },
                  children: [
                    {
                      tag: "input",
                      attributes: {
                        type: "number",
                        min: "0",
                        value: "1",
                        style: "width: 50px; min-width: 50px; margin-right: 6px; padding: 4px 8px;",
                        class: ["ck-cta-form-input"]
                      }
                    },
                    {
                      tag: "span",
                      attributes: { style: "margin-right: 16px; font-weight: 500; color: var(--palette-grey-1000);" },
                      children: ["days,"]
                    },
                    {
                      tag: "input",
                      attributes: {
                        type: "number",
                        min: "0",
                        value: "0",
                        style: "width: 50px; min-width: 50px; margin-right: 6px; padding: 4px 8px;",
                        class: ["ck-cta-form-input"]
                      }
                    },
                    {
                      tag: "span",
                      attributes: { style: "margin-right: 16px; font-weight: 500; color: var(--palette-grey-1000);" },
                      children: ["hours,"]
                    },
                    {
                      tag: "input",
                      attributes: {
                        type: "number",
                        min: "0",
                        value: "0",
                        style: "width: 50px; min-width: 50px; margin-right: 6px; padding: 4px 8px;",
                        class: ["ck-cta-form-input"]
                      }
                    },
                    {
                      tag: "span",
                      attributes: { style: "font-weight: 500; color: var(--palette-grey-1000);" },
                      children: ["minutes"]
                    }
                  ]
                }
              ]
            }
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

    const childViews = [this.questionView, this.disagreeWordingView,  this.agreeWordingView];

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
      tag: "textarea",
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

        const props = this.selectedElement.getAttribute("props") as PollProps;
        const inputValue = questionView.element.value.trim();
        
        writer.setAttribute("props", {...props, question: inputValue}, this.selectedElement);
      });
    });

    // Create agree wording input
    const agreeWordingView = new InputTextView(this.locale);
    const agreeWordingBind = agreeWordingView.bindTemplate;
    agreeWordingView.setTemplate({
      tag: "input",
      attributes: {
        type: "text",
        class: ["ck-cta-form-input", agreeWordingBind.if("hasError", "ck-error")],
        id: agreeWordingBind.to("id"),
        readonly: false,
        "aria-invalid": agreeWordingBind.if("hasError", true),
        "aria-describedby": agreeWordingBind.to("ariaDescribedById"),
      },
      on: {
        input: agreeWordingBind.to("input"),
      },
    });
    (agreeWordingView as AnyBecauseTodo).label = "Right label";
    agreeWordingView.on("input", () => {
      const model = this.editor.model;
      const selectedElement = this.selectedElement;

      model.change((writer: Writer) => {
        if (!selectedElement) return;

        const props = this.selectedElement.getAttribute("props") as PollProps;
        const inputValue = agreeWordingView.element.value.trim();

        writer.setAttribute("props", {...props, agreeWording: inputValue}, this.selectedElement);
      });
    });

    // Create disagree wording input
    const disagreeWordingView = new InputTextView(this.locale);
    const disagreeWordingBind = disagreeWordingView.bindTemplate;
    disagreeWordingView.setTemplate({
      tag: "input",
      attributes: {
        type: "text",
        class: ["ck-cta-form-input", disagreeWordingBind.if("hasError", "ck-error")],
        id: disagreeWordingBind.to("id"),
        readonly: false,
        "aria-invalid": disagreeWordingBind.if("hasError", true),
        "aria-describedby": disagreeWordingBind.to("ariaDescribedById"),
      },
      on: {
        input: disagreeWordingBind.to("input"),
      },
    });
    // TODO clean up unecessary things here
    (disagreeWordingView as AnyBecauseTodo).label = "Left label";
    disagreeWordingView.on("input", () => {
      const model = this.editor.model;
      const selectedElement = this.selectedElement;

      model.change((writer: Writer) => {
        if (!selectedElement) return;

        const props = this.selectedElement.getAttribute("props") as PollProps;
        const inputValue = disagreeWordingView.element.value.trim();

        writer.setAttribute("props", {...props, disagreeWording: inputValue}, this.selectedElement);
      });
    });

    return {
      questionView,
      agreeWordingView,
      disagreeWordingView,
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

    const pollProps = selectedElement.getAttribute("props") as PollProps;
    this.formView.questionView.element.value = pollProps.question;
    this.formView.agreeWordingView.element.value = pollProps.agreeWording;
    this.formView.disagreeWordingView.element.value = pollProps.disagreeWording;
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
   * Check if the current selected element is a poll and return it if so
   */
  _getSelectedPoll() {
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

    // Show panel when a poll is clicked
    this.listenTo(viewDocument, "click", (evt, data) => {
      const selectedElement = this._getSelectedPoll();
      const domTarget = data.domTarget;
      // isTargetPoll is here to make clicking away to exit work better, because clicks not quite
      // on the poll can select it
      const isTargetPoll = domTarget && domTarget.classList && domTarget.classList.contains(POLL_CLASS);

      if (selectedElement && isTargetPoll) {
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
