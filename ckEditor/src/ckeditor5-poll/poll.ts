import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";
import { toWidget } from "@ckeditor/ckeditor5-widget/src/utils";
import Widget from "@ckeditor/ckeditor5-widget/src/widget";
import PollForm from "./poll-form";
import buttonIcon from "./ckeditor5-cta-button.svg";
import { randomId } from "../random";

const POLL_CLASS = "ck-poll";

/**
 * Plugin for the CTA button element itself, the form for editing the text and link
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
    this._defineStyles();

    editor.ui.componentFactory.add("pollToolbarItem", (locale) => {
      const toolbarButton = new ButtonView(locale);

      toolbarButton.isEnabled = true;
      toolbarButton.label = editor.t("Insert poll");
      toolbarButton.icon = buttonIcon;
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

          const pollElement = writer.createElement("poll", { id: uniqueId });
          const pollText = writer.createText("My poll question");
          writer.append(pollText, pollElement);

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
      allowAttributes: ["id", "votes"],
    });
  }

  _defineStyles() {
    // Inject styles into the document head
    const style = document.createElement('style');
    style.innerHTML = `
      .${POLL_CLASS} {
        text-align: center;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
        margin: 10px 0;
      }
      .${POLL_CLASS}-question {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .${POLL_CLASS}-slider {
        position: relative;
        height: 2px;
        background: #333;
        margin: 40px 60px;
      }
      .${POLL_CLASS}-circle {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #666;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid #333;
      }
      .${POLL_CLASS}-labels {
        display: flex;
        justify-content: space-between;
        margin: 10px 40px;
      }
      .${POLL_CLASS}-label {
        font-weight: 500;
        color: #333;
      }
    `;
    document.head.appendChild(style);
  }

  _defineConverters() {
    const editor = this.editor;

    editor.conversion.for("editingDowncast").elementToElement({
      model: "poll",
      view: (modelElement, { writer: viewWriter }) => {
        const container = viewWriter.createContainerElement("div", {
          class: POLL_CLASS,
          "data-internal-id": modelElement.getAttribute("id") || "",
        });

        // Create question container
        const questionContainer = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-question`
        });
        viewWriter.insert(
          viewWriter.createPositionAt(questionContainer, 0),
          viewWriter.createText((modelElement.getChild(0) as unknown as Text).data)
        );

        // Create slider container
        const sliderContainer = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-slider`
        });

        // Create circle
        const circle = viewWriter.createEmptyElement("div", {
          class: `${POLL_CLASS}-circle`
        });

        // Create labels container
        const labelsContainer = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-labels`
        });

        // Create disagree label
        const disagreeLabel = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-label`
        });
        viewWriter.insert(
          viewWriter.createPositionAt(disagreeLabel, 0),
          viewWriter.createText("Disagree")
        );

        // Create agree label
        const agreeLabel = viewWriter.createContainerElement("div", {
          class: `${POLL_CLASS}-label`
        });
        viewWriter.insert(
          viewWriter.createPositionAt(agreeLabel, 0),
          viewWriter.createText("Agree")
        );

        // Assemble the widget
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

    editor.conversion.for("dataDowncast").elementToElement({
      model: "poll",
      view: (modelElement, { writer: viewWriter }) => {
        const container = viewWriter.createContainerElement("div", {
          class: POLL_CLASS,
          "data-internal-id": modelElement.getAttribute("id") || "",
        });
        
        const text = (modelElement.getChild(0) as unknown as Text).data;
        viewWriter.insert(
          viewWriter.createPositionAt(container, 0),
          viewWriter.createText(text)
        );
        
        return container;
      }
    });

    editor.conversion.for("upcast").elementToElement({
      view: {
        name: "div",
        classes: POLL_CLASS,
      },
      model: (viewElement, { writer: modelWriter }) => {
        const poll = modelWriter.createElement("poll");
        const internalId = viewElement.getAttribute("data-internal-id");
        if (internalId) {
          modelWriter.setAttribute("id", internalId, poll);
        }
        const text = viewElement.getChild(0) as unknown as Text;
        modelWriter.append(
          modelWriter.createText(text.data),
          poll
        );
        return poll;
      }
    });
  }
}
