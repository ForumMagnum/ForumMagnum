import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import { toWidget } from "@ckeditor/ckeditor5-widget/src/utils";
import Widget from "@ckeditor/ckeditor5-widget/src/widget";
import {
  createDropdown,
  addListToDropdown,
  ListDropdownItemDefinition,
} from "@ckeditor/ckeditor5-ui/src/dropdown/utils";
import Model from "@ckeditor/ckeditor5-ui/src/model";
import Collection from "@ckeditor/ckeditor5-utils/src/collection";
import PollForm, { DEFAULT_POLL_DURATION, POLL_COLOR_SCHEMES, toDbColorScheme } from "./poll-form";
import pollIcon from "./poll-icon.svg";
import mcPollIcon from "./mc-poll-icon.svg";
import pollDropdownIcon from "./poll-dropdown-icon.svg";
import { randomId } from "../random";
import { POLL_CLASS, PollProps, isMultipleChoicePoll } from "./constants";
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { DowncastWriter } from "@ckeditor/ckeditor5-engine";

const DEFAULT_PROPS: PollProps = {
  // The slider poll is an agree/disagree statement, not a question.
  question: "Write a statement",
  agreeWording: "agree",
  disagreeWording: "disagree",
  colorScheme: toDbColorScheme(POLL_COLOR_SCHEMES[0]),
  duration: DEFAULT_POLL_DURATION
}

// Multiple-choice polls reuse the slider defaults (colour/duration/wording) and
// add an answer list. agree/disagree wording is unused here but kept so the
// shared `PollProps` shape stays satisfied.
function mcDefaultProps(): PollProps {
  return {
    ...DEFAULT_PROPS,
    // Unlike the slider, a multiple-choice poll really is a question.
    question: "Ask a question",
    multiSelect: false,
    answers: [
      { _id: randomId(), text: "Answer 1" },
      { _id: randomId(), text: "Answer 2" },
    ],
  };
}

/** Build the in-editor preview for a multiple-choice poll. */
function insertMcPollChildren(
  viewWriter: DowncastWriter,
  container: ViewElement,
  props: PollProps,
) {
  const questionContainer = viewWriter.createContainerElement("div", {
    class: `${POLL_CLASS}-question`,
  });
  viewWriter.insert(
    viewWriter.createPositionAt(questionContainer, 0),
    viewWriter.createText(props.question),
  );
  viewWriter.insert(viewWriter.createPositionAt(container, "end"), questionContainer);

  const optionsContainer = viewWriter.createContainerElement("div", {
    class: `${POLL_CLASS}-mc-options`,
  });
  for (const answer of props.answers ?? []) {
    const option = viewWriter.createContainerElement("div", {
      class: `${POLL_CLASS}-mc-option`,
    });
    const bulletClasses = [`${POLL_CLASS}-mc-bullet`];
    if (props.multiSelect) {
      bulletClasses.push(`${POLL_CLASS}-mc-bullet-square`);
    }
    const bullet = viewWriter.createEmptyElement("div", {
      class: bulletClasses,
    });
    const label = viewWriter.createContainerElement("div", {
      class: `${POLL_CLASS}-mc-label`,
    });
    viewWriter.insert(
      viewWriter.createPositionAt(label, 0),
      viewWriter.createText(answer.text),
    );
    viewWriter.insert(viewWriter.createPositionAt(option, "end"), bullet);
    viewWriter.insert(viewWriter.createPositionAt(option, "end"), label);
    viewWriter.insert(viewWriter.createPositionAt(optionsContainer, "end"), option);
  }
  viewWriter.insert(viewWriter.createPositionAt(container, "end"), optionsContainer);
}

/** Helper function to update a text value in the editor view */
function updateViewElementText(
  viewWriter: DowncastWriter,
  rootViewElement: ViewElement,
  classPath: string[],
  newText: string
) {
  if (classPath.length < 1) return;

  const [headClass, ...tail] = classPath;

  const targetElement = Array.from(rootViewElement.getChildren() as unknown as ViewElement[]).find(
    child => child.hasClass(headClass)
  );
  if (!targetElement) return;

  if (tail.length > 0) {
    updateViewElementText(viewWriter, targetElement, tail, newText);
  } else {
    const existingText = targetElement.getChild(0);

    if (existingText && existingText.is('$text') && existingText.data === newText) {
      return;
    }

    if (existingText) {
      viewWriter.remove(existingText);
    }
    viewWriter.insert(
      viewWriter.createPositionAt(targetElement, 0),
      viewWriter.createText(newText)
    );
  }
}

/**
 * Plugin for the poll element itself, the form for editing the text and link
 * is defined in a separate plugin, PollForm
 */
export default class PollPlugin extends Plugin {
  static get requires() {
    return [Widget, PollForm];
  }

  init() {
    const editor = this.editor;
    this._defineSchema();
    this._defineConverters();

    const insertPoll = (props: PollProps) => {
      const model = editor.model;

      model.change((writer) => {
        const uniqueId = randomId();
        const selection = editor.model.document.selection;
        const currentElement = selection.getFirstPosition().parent;
        let insertPosition;

        if (currentElement.childCount > 0) {
          insertPosition = writer.createPositionAfter(currentElement as AnyBecauseTodo);
        } else {
          insertPosition = writer.createPositionAt(currentElement, 0);
        }

        const pollElement = writer.createElement("poll", {
          id: uniqueId,
          props,
        });

        model.insertContent(pollElement, insertPosition);
      });
    };

    const SLIDER_LABEL = "Slider";
    const MULTIPLE_CHOICE_LABEL = "Multiple choice";

    // A single "Insert poll" dropdown offering the two poll types.
    editor.ui.componentFactory.add("pollToolbarItem", (locale) => {
      const dropdownView = createDropdown(locale);
      dropdownView.class = "ck-poll-dropdown";
      dropdownView.buttonView.set({
        label: editor.t("Insert poll"),
        icon: pollDropdownIcon,
        tooltip: true,
      });

      const items = new Collection<ListDropdownItemDefinition>();
      items.add({
        type: "button",
        model: new Model({
          label: SLIDER_LABEL,
          icon: pollIcon,
          withText: true,
        }),
      });
      items.add({
        type: "button",
        model: new Model({
          label: MULTIPLE_CHOICE_LABEL,
          icon: mcPollIcon,
          withText: true,
        }),
      });
      addListToDropdown(dropdownView, items);

      dropdownView.on("execute", (evt) => {
        const label = (evt.source as { label?: string }).label;
        insertPoll(
          label === MULTIPLE_CHOICE_LABEL ? mcDefaultProps() : { ...DEFAULT_PROPS },
        );
      });

      return dropdownView;
    });
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register("poll", {
      allowWhere: "$block",
      isBlock: true,
      isObject: true,
      allowContentOf: "$text",
      allowIn: "$root",
      allowAttributes: ["id", "props"],
    });
  }

  _defineConverters() {
    const editor = this.editor;

    editor.conversion.for("editingDowncast").elementToElement({
      model: "poll",
      view: (modelElement, { writer: viewWriter }) => {
        const id: string = modelElement.getAttribute("id") as string;
        const props: PollProps = modelElement.getAttribute("props") as PollProps;
        const { colorScheme } = props;

        const container = viewWriter.createContainerElement("div", {
          class: POLL_CLASS,
          "data-internal-id": id,
          style: `
            --forum-event-background: ${colorScheme.darkColor};
            --forum-event-banner-text: ${colorScheme.bannerTextColor};
            --forum-event-foreground: ${colorScheme.lightColor};
          `
        });

        if (isMultipleChoicePoll(props)) {
          insertMcPollChildren(viewWriter, container, props);
          return toWidget(container, viewWriter, {
            label: "Multiple-choice poll widget"
          });
        }

        const questionContainer = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-question`
        });
        viewWriter.insert(
          viewWriter.createPositionAt(questionContainer, 0),
          viewWriter.createText(props.question)
        );

        const sliderContainer = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-slider`
        });

        const circle = viewWriter.createEmptyElement("div", {
          class: `${POLL_CLASS}-circle`
        });

        const labelsContainer = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-labels`
        });

        const disagreeLabel = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-label ${POLL_CLASS}-disagree`
        });
        viewWriter.insert(
          viewWriter.createPositionAt(disagreeLabel, 0),
          viewWriter.createText(props.disagreeWording)
        );

        const agreeLabel = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-label ${POLL_CLASS}-agree`
        });
        viewWriter.insert(
          viewWriter.createPositionAt(agreeLabel, 0),
          viewWriter.createText(props.agreeWording)
        );

        viewWriter.insert(viewWriter.createPositionAt(container, 'end'), questionContainer);
        viewWriter.insert(viewWriter.createPositionAt(sliderContainer, 'end'), circle);
        viewWriter.insert(viewWriter.createPositionAt(container, 'end'), sliderContainer);
        viewWriter.insert(viewWriter.createPositionAt(labelsContainer, 'end'), disagreeLabel);
        viewWriter.insert(viewWriter.createPositionAt(labelsContainer, 'end'), agreeLabel);
        viewWriter.insert(viewWriter.createPositionAt(container, 'end'), labelsContainer);

        return toWidget(container, viewWriter, {
          label: "Poll widget"
        });
      }
    });

    editor.conversion.for("editingDowncast").attributeToElement({
      model: {
        key: 'props',
        name: 'poll'
      },
      view: (props: PollProps, { writer: viewWriter }, data) => {
        if (!props) return;

        const pollModelElement = data.item as ModelElement;
        if (!pollModelElement) return;

        const pollViewElement = editor.editing.mapper.toViewElement(pollModelElement);
        if (!pollViewElement) return;

        const { colorScheme } = props;
        const applyColorScheme = () => {
          if (colorScheme) {
            viewWriter.setStyle(
              {
                '--forum-event-background': colorScheme.darkColor,
                '--forum-event-banner-text': colorScheme.bannerTextColor,
                '--forum-event-foreground': colorScheme.lightColor
              },
              pollViewElement
            );
          }
        };

        if (isMultipleChoicePoll(props)) {
          // The answer list is dynamic, so rebuild the preview's contents from
          // scratch rather than trying to patch individual rows.
          viewWriter.remove(viewWriter.createRangeIn(pollViewElement));
          insertMcPollChildren(viewWriter, pollViewElement, props);
          applyColorScheme();
          return;
        }

        // Update text content
        updateViewElementText(viewWriter, pollViewElement, [`${POLL_CLASS}-question`], props.question);
        updateViewElementText(viewWriter, pollViewElement, [`${POLL_CLASS}-labels`, `${POLL_CLASS}-disagree`], props.disagreeWording);
        updateViewElementText(viewWriter, pollViewElement, [`${POLL_CLASS}-labels`, `${POLL_CLASS}-agree`], props.agreeWording);

        applyColorScheme();
      }
    });

    editor.conversion.for("dataDowncast").elementToElement({
      model: "poll",
      view: (modelElement, { writer: viewWriter }) => {
        const id = modelElement.getAttribute("id") || "";
        const props = modelElement.getAttribute("props") || {};

        const container = viewWriter.createContainerElement("div", {
          class: POLL_CLASS,
          "data-internal-id": id,
          "data-props": JSON.stringify(props)
        });

        return container;
      }
    });

    editor.conversion.for("upcast").elementToElement({
      view: {
        name: "div",
        classes: POLL_CLASS,
      },
      model: (viewElement, { writer: modelWriter }) => {
        const internalId = viewElement.getAttribute("data-internal-id");
        const propsString = viewElement.getAttribute("data-props");

        let props = { ...DEFAULT_PROPS };
        if (propsString) {
          const parsedProps = JSON.parse(propsString);
          props = {
              ...props,
              ...parsedProps,
          };
        }

        const pollElement = modelWriter.createElement("poll", {
            id: internalId || randomId(),
            props: props
        });

        return pollElement;
      }
    });
  }
}
