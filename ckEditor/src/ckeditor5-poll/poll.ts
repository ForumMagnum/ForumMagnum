import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";
import { toWidget } from "@ckeditor/ckeditor5-widget/src/utils";
import Widget from "@ckeditor/ckeditor5-widget/src/widget";
import PollForm, { POLL_COLOR_SCHEMES } from "./poll-form";
import pollIcon from "./poll-icon.svg";
import { randomId } from "../random";
import { POLL_CLASS, PollProps } from "./constants";
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { DowncastWriter } from "@ckeditor/ckeditor5-engine";

const DEFAULT_PROPS: PollProps = {
  question: "Ask a question",
  agreeWording: "agree",
  disagreeWording: "disagree",
  colorScheme: POLL_COLOR_SCHEMES[0],
  duration: { days: 1, hours: 0, minutes: 0 }
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

    editor.ui.componentFactory.add("pollToolbarItem", (locale) => {
      const toolbarButton = new ButtonView(locale);

      toolbarButton.isEnabled = true;
      toolbarButton.label = editor.t("Insert poll");
      toolbarButton.icon = pollIcon;
      toolbarButton.tooltip = true;

      toolbarButton.on("execute", () => {
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

          const pollElement = writer.createElement("poll", { id: uniqueId, props: { ...DEFAULT_PROPS } });

          model.insertContent(pollElement, insertPosition);
        });
      });

      return toolbarButton;
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
          class: [`${POLL_CLASS}-label`, `${POLL_CLASS}-disagree`]
        });
        viewWriter.insert(
          viewWriter.createPositionAt(disagreeLabel, 0),
          viewWriter.createText(props.disagreeWording)
        );

        const agreeLabel = viewWriter.createContainerElement("div", {
           class: [`${POLL_CLASS}-label`, `${POLL_CLASS}-agree`]
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

        // Update text content
        updateViewElementText(viewWriter, pollViewElement, [`${POLL_CLASS}-question`], props.question);
        updateViewElementText(viewWriter, pollViewElement, [`${POLL_CLASS}-labels`, `${POLL_CLASS}-disagree`], props.disagreeWording);
        updateViewElementText(viewWriter, pollViewElement, [`${POLL_CLASS}-labels`, `${POLL_CLASS}-agree`], props.agreeWording);

        // Update color scheme
        const { colorScheme } = props;
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
