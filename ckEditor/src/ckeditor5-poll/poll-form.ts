import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ClickObserver from "@ckeditor/ckeditor5-engine/src/view/observer/clickobserver";
import ContextualBalloon from "@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon";
import clickOutsideHandler from "@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler";

import View from "@ckeditor/ckeditor5-ui/src/view";
import ViewCollection from "@ckeditor/ckeditor5-ui/src/viewcollection";
import InputTextView from "@ckeditor/ckeditor5-ui/src/inputtext/inputtextview";
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import KeystrokeHandler from "@ckeditor/ckeditor5-utils/src/keystrokehandler";
import FocusTracker from "@ckeditor/ckeditor5-utils/src/focustracker";
import FocusCycler, { FocusableView } from "@ckeditor/ckeditor5-ui/src/focuscycler";

import type { Editor } from "@ckeditor/ckeditor5-core";
import type { Locale } from "@ckeditor/ckeditor5-utils";
import type { Element, RootElement } from "@ckeditor/ckeditor5-engine";
import type Writer from "@ckeditor/ckeditor5-engine/src/model/writer";

import submitHandler from "@ckeditor/ckeditor5-ui/src/bindings/submithandler";

import './poll.css';
import { PollProps } from "./constants";

// TODO clean up comments

export const POLL_COLOR_SCHEMES: PollProps['colorScheme'][] = [
  { darkColor: '#06005C', lightColor: '#FFFFFF', bannerTextColor: '#FFFFFF'},
  { darkColor: '#1D2A17', lightColor: '#FFFFFF', bannerTextColor: '#FFFFFF'},
  { darkColor: '#7B3402', lightColor: '#FFFFFF', bannerTextColor: '#FFFFFF'},
  { darkColor: '#F3F3E1', lightColor: '#222222', bannerTextColor: '#222222'},
]

class MainFormView extends View {
  editor: Editor
  selectedElement: (Element | RootElement)
  questionView: InputTextView
  agreeWordingView: InputTextView
  disagreeWordingView: InputTextView
  colorSchemeButtons: ButtonView[]
  daysInputView: InputTextView
  hoursInputView: InputTextView
  minutesInputView: InputTextView
  _focusables: ViewCollection<FocusableView>
  focusTracker: FocusTracker
  keystrokes: KeystrokeHandler
  _focusCycler: FocusCycler
  locale: Locale

  constructor(locale: Locale, editor: Editor) {
    super(locale);

    this.editor = editor;
    this._createKeyAndFocusTrackers();

    this.selectedElement = null;

    const {
      questionView,
      agreeWordingView,
      disagreeWordingView,
      colorSchemeButtons,
      daysInputView,
      hoursInputView,
      minutesInputView
    } = this._createInputs();
    this.questionView = questionView;
    this.agreeWordingView = agreeWordingView;
    this.disagreeWordingView = disagreeWordingView;
    this.colorSchemeButtons = colorSchemeButtons;
    this.daysInputView = daysInputView;
    this.hoursInputView = hoursInputView;
    this.minutesInputView = minutesInputView;

    this.setTemplate({
      tag: "form",
      attributes: {
        class: ["ck", "ck-poll-form"],
        tabindex: "-1",
        spellcheck: "false",
      },
      children: [
        {
          tag: "div",
          attributes: {
            class: ["ck-poll-form-group"],
          },
          children: [
            {
              tag: "div",
              attributes: {
                class: ["ck-poll-form-label"],
              },
              children: ["Question"],
            },
            questionView
          ]
        },
        {
          tag: "div",
          attributes: {
            class: ["ck-poll-form-row"],
          },
          children: [
            {
              tag: "div",
              attributes: {
                class: ["ck-poll-form-group"],
              },
              children: [
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-poll-form-label"],
                  },
                  children: ["Left side"],
                },
                disagreeWordingView
              ]
            },
            {
              tag: "div",
              attributes: {
                class: ["ck-poll-form-group"],
              },
              children: [
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-poll-form-label"],
                  },
                  children: ["Right side"],
                },
                agreeWordingView
              ]
            },
          ]
        },
        {
          tag: "div",
          attributes: {
            class: ["ck-poll-form-row"],
          },
          children: [
            {
              tag: "div",
              attributes: {
                class: ["ck-poll-form-group"],
              },
              children: [
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-poll-form-label", "ck-poll-form-label-bold"],
                  },
                  children: ["Color"]
                },
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-poll-color-selector-container"],
                  },
                  children: this.colorSchemeButtons
                }
              ]
            },
            {
              tag: "div",
              attributes: {
                class: ["ck-poll-form-group", "ck-poll-duration-group"],
              },
              children: [
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-poll-form-label", "ck-poll-form-label-bold"],
                  },
                  children: ["Duration"]
                },
                {
                  tag: "div",
                  attributes: {
                    class: ["ck-poll-duration-input-container"]
                  },
                  children: [
                    this.daysInputView,
                    {
                      tag: "span",
                      attributes: { class: ["ck-poll-duration-label-unit"] },
                      children: ["days"]
                    },
                    this.hoursInputView,
                    {
                      tag: "span",
                      attributes: { class: ["ck-poll-duration-label-unit"] },
                      children: ["hours"]
                    },
                    this.minutesInputView,
                    {
                      tag: "span",
                      attributes: { class: ["ck-poll-duration-label-unit"] },
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
    this.questionView.element.classList.remove('ck-poll-error');
  }

  render() {
    super.render();

    submitHandler({
      view: this,
    });

    const childViews = [
        this.questionView,
        this.disagreeWordingView,
        this.agreeWordingView,
        ...this.colorSchemeButtons,
        this.daysInputView,
        this.hoursInputView,
        this.minutesInputView
    ];

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
        class: ["ck-poll-form-input", questionBind.if("hasError", "ck-error")],
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
        class: ["ck-poll-form-input", agreeWordingBind.if("hasError", "ck-error")],
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
        class: ["ck-poll-form-input", disagreeWordingBind.if("hasError", "ck-error")],
        id: disagreeWordingBind.to("id"),
        readonly: false,
        "aria-invalid": disagreeWordingBind.if("hasError", true),
        "aria-describedby": disagreeWordingBind.to("ariaDescribedById"),
      },
      on: {
        input: disagreeWordingBind.to("input"),
      },
    });
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

    // Create color scheme buttons
    const colorSchemeButtons = POLL_COLOR_SCHEMES.map((colorScheme, index) => {
      const buttonView = new ButtonView(this.locale);

      buttonView.on('render', () => {
        // Apply dynamic background color
        buttonView.element.style.backgroundColor = colorScheme.darkColor;
        // Add class on initial render
        buttonView.element.classList.add('ck-color-selector-button');
      });

      buttonView.on('execute', () => {
        const model = this.editor.model;
        const selectedElement = this.selectedElement;

        if (!selectedElement) return;

        model.change((writer: Writer) => {
          const props = this.selectedElement.getAttribute("props") as PollProps;
          const newColorScheme = POLL_COLOR_SCHEMES[index];

          writer.setAttribute("props", {...props, colorScheme: newColorScheme}, this.selectedElement);

          this.colorSchemeButtons.forEach((btn, btnIndex) => {
            btn.isOn = (index === btnIndex);
             // Ensure the class is still present after potential CKEditor updates
            if (btn.element) { // Check if element exists
               btn.element.classList.add('ck-color-selector-button');
            }
          });
        });

        // Also ensure the class is on the clicked button itself after execute finishes
        if (buttonView.element) {
           buttonView.element.classList.add('ck-color-selector-button');
        }
      });

      return buttonView;
    });

    // --- Create Duration Inputs ---
    const createDurationInput = (label: string, initialValue: number = 0): InputTextView => {
        const inputView = new InputTextView(this.locale);
        const inputBind = inputView.bindTemplate;
        inputView.setTemplate({
            tag: 'input',
            attributes: {
                type: 'number',
                min: '0',
                class: ['ck-poll-form-input', 'ck-duration-input'],
                id: inputBind.to('id'),
                'aria-label': label,
            },
            on: {
                input: inputBind.to('input')
            }
        });
        (inputView as AnyBecauseTodo).label = label;

        // Add the input listener to update the model
        inputView.on('input', () => {
            const model = this.editor.model;
            const selectedElement = this.selectedElement;

            if (!selectedElement) return;

            model.change((writer: Writer) => {
                const props = selectedElement.getAttribute("props") as PollProps;

                // Read all duration values safely
                const days = parseInt(this.daysInputView.element.value, 10) || 0;
                const hours = parseInt(this.hoursInputView.element.value, 10) || 0;
                const minutes = parseInt(this.minutesInputView.element.value, 10) || 0;

                const newDuration = { days, hours, minutes };

                writer.setAttribute("props", { ...props, duration: newDuration }, selectedElement);
            });
        });

        return inputView;
    };

    const daysInputView = createDurationInput('Days');
    const hoursInputView = createDurationInput('Hours');
    const minutesInputView = createDurationInput('Minutes');
    // --- End Duration Inputs ---

    return {
      questionView,
      agreeWordingView,
      disagreeWordingView,
      colorSchemeButtons,
      daysInputView,
      hoursInputView,
      minutesInputView
    };
  }
}

/**
 * Plugin for the form to edit the text and link of a CTA button
 */
export default class PollForm extends Plugin {
  formView: MainFormView
  _balloon: ContextualBalloon

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
      // If the form is already open, update the values in case the selection changed
      // or if props were updated externally (less common but possible)
      this.formView.selectedElement = selectedElement;
      const pollProps = selectedElement.getAttribute("props") as PollProps;
      this.formView.questionView.element.value = pollProps.question || '';
      this.formView.agreeWordingView.element.value = pollProps.agreeWording || '';
      this.formView.disagreeWordingView.element.value = pollProps.disagreeWording || '';

      // Update duration inputs
      const duration = pollProps.duration || { days: 1, hours: 0, minutes: 0 }; // Use default if missing
      this.formView.daysInputView.value = duration.days.toString();
      this.formView.hoursInputView.value = duration.hours.toString();
      this.formView.minutesInputView.value = duration.minutes.toString();

      // Update color button selection state
      const currentColorScheme = pollProps.colorScheme;
      const currentIndex = POLL_COLOR_SCHEMES.findIndex(cs =>
          cs.darkColor === currentColorScheme?.darkColor && cs.lightColor === currentColorScheme?.lightColor
      );
      this.formView.colorSchemeButtons.forEach((btn, btnIndex) => {
          btn.isOn = (currentIndex === btnIndex);
      });

      return; // Don't add the view again
    }

    // --- If form is not already open ---
    this._balloon.add({
      view: this.formView,
      position: this._getBalloonPositionData(),
      balloonClassName: "ck-poll-balloon",
    });

    this.formView.questionView.select(); // Focus the first field
    this.formView.selectedElement = selectedElement;

    // Initialize values from the selected element's props
    const pollProps = selectedElement.getAttribute("props") as PollProps;
    this.formView.questionView.element.value = pollProps.question || '';
    this.formView.agreeWordingView.element.value = pollProps.agreeWording || '';
    this.formView.disagreeWordingView.element.value = pollProps.disagreeWording || '';

    // Initialize duration inputs
    const duration = pollProps.duration || { days: 1, hours: 0, minutes: 0 }; // Use default if missing
    this.formView.daysInputView.value = duration.days.toString();
    this.formView.hoursInputView.value = duration.hours.toString();
    this.formView.minutesInputView.value = duration.minutes.toString();

    // Initialize color button selection state
    const currentColorScheme = pollProps.colorScheme;
    const currentIndex = POLL_COLOR_SCHEMES.findIndex(cs =>
        cs.darkColor === currentColorScheme?.darkColor && cs.lightColor === currentColorScheme?.lightColor
    );
     this.formView.colorSchemeButtons.forEach((btn, btnIndex) => {
        btn.isOn = (currentIndex === btnIndex);
    });
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

      if (selectedElement) {
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
