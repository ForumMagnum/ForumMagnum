import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";
import { toWidget } from "@ckeditor/ckeditor5-widget/src/utils";
import Widget from "@ckeditor/ckeditor5-widget/src/widget";
import PollForm from "./poll-form";

import buttonIcon from "./ckeditor5-cta-button.svg";
import { randomId } from "../random";

const CTA_CLASS = "ck-poll";

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

    // Define the properties of the poll element to allow in the model
    this._defineSchema();
    // Define the conversions from model -> data view, model -> editing view, editing view -> model
    this._defineConverters();

    // Add the toolbar item for inserting a cta button
    editor.ui.componentFactory.add("pollToolbarItem", (locale) => {
      const toolbarButton = new ButtonView(locale);

      toolbarButton.isEnabled = true;
      toolbarButton.label = editor.t("Insert button");
      toolbarButton.icon = buttonIcon;
      toolbarButton.tooltip = true;

      // When creating the CTA button, you no longer need to append the text node directly
      toolbarButton.on("execute", () => {
        const model = editor.model;

        model.change((writer) => {
          // Generate a unique ID for the poll element
          const uniqueId = randomId();

          // Insert the button as a new block after the current block
          const selection = editor.model.document.selection;
          const currentElement = selection.getFirstPosition().parent;
          let insertPosition;

          // Check if the current block has any content
          if (currentElement.childCount > 0) {
            // If there is content, insert after the current block
            insertPosition = writer.createPositionAfter(currentElement as AnyBecauseTodo);
          } else {
            // If there is no content, use the current block itself
            insertPosition = writer.createPositionAt(currentElement, 0);
          }

          const buttonElement = writer.createElement("poll", { id: uniqueId });
          const buttonText = writer.createText("My poll question");
          writer.append(buttonText, buttonElement);

          // Insert the 'poll' element at the calculated position
          model.insertContent(buttonElement, insertPosition);
        });
      });

      return toolbarButton;
    });
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register("poll", {
      allowWhere: "$block", // Allow where block elements (e.g. paragraphs) are allowed
      isBlock: true,
      isObject: true, // Required to make the whole block selectable (to delete) and the text content non-editable
      allowContentOf: "$text",
      allowIn: "$root",
      allowAttributes: ["id", "class", "href"],
    });
  }

  _defineConverters() {
    const editor = this.editor;

    // Model -> Editing view
    editor.conversion.for("editingDowncast").elementToElement({
      model: "poll",
      view: (modelElement, { writer: viewWriter }) => {
        const existingClasses = (modelElement.getAttribute("class") || "").toString();
        const div = viewWriter.createContainerElement("div", {
          class: [CTA_CLASS, ...existingClasses.split(" ")].join(" "),
          href: modelElement.getAttribute("href") || "",
          "data-internal-id": modelElement.getAttribute("id") || "",
        });

        return toWidget(div, viewWriter, {});
      },
    });

    // Model -> Data view
    editor.conversion.for("dataDowncast").elementToElement({
      model: "poll",
      view: (modelElement, { writer: viewWriter }) => {
        // Note: I'm using a div rather than a plain <a> element because the
        // href on the <a> element appears to also get picked up by another plugin which
        // breaks things. I'm also using a div instead of a <button> to simplify what we
        // allow in `sanitize()` (see packages/lesswrong/lib/vulcan-lib/utils.ts)
        const existingClasses = (modelElement.getAttribute("class") || "").toString();
        const div = viewWriter.createContainerElement("a", {
          class: [CTA_CLASS, ...existingClasses.split(" ")].join(" "),
          // The href on the <a> element appears to also get picked up by another plugin, which
          // breaks things, so use data-href and map it to href in ContentItemBody
          "data-href": modelElement.getAttribute("href") || "",
          // Make the link open in a new tab to ensure we can capture analytics
          target: "_blank",
          rel: "noopener noreferrer",
          "data-internal-id": modelElement.getAttribute("id") || "",
        });
        return div;
      },
    });

    // Editing view -> model
    editor.conversion.for("upcast").elementToElement({
      view: {
        name: "a",
        classes: CTA_CLASS,
      },
      model: (viewElement, { writer: modelWriter }) => {
        const poll = modelWriter.createElement("poll");
        modelWriter.setAttribute("href", viewElement.getAttribute("data-href") || "", poll);
        modelWriter.setAttribute("id", viewElement.getAttribute("data-internal-id") || "", poll);

        // Map the text nodes from the view to the model
        const innerText = (viewElement.getChild(0) as AnyBecauseTodo).data;
        const textNode = modelWriter.createText(innerText);
        modelWriter.append(textNode, poll);

        return poll;
      },
    });
  }
}
