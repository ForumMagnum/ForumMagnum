/* eslint-disable no-tabs */
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

import submitHandler from "@ckeditor/ckeditor5-ui/src/bindings/submithandler";

class MainFormView extends View {
	constructor(locale, editor) {
		super(locale);

		this.editor = editor;
		this._createKeyAndFocusTrackers();

		// selectedElement will be set to the button that is clicked on (there can be multiple in the same editor)
		this.selectedElement = null;

		// Equation input
		const { buttonTextView, linkToView } = this._createInputs();
		this.buttonTextView = buttonTextView;
		this.linkToView = linkToView;

		this.previewEnabled = true;

		let children = [];
		children = [buttonTextView, linkToView];

		// Add UI elements to template
		this.setTemplate({
			tag: "form",
			attributes: {
				class: ["ck", "ck-math-form"],
				tabindex: "-1",
				spellcheck: "false",
			},
			children: [
				{
					tag: "div",
					attributes: {
						class: ["ck-math-view"],
					},
					children,
				},
			],
		});
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
				class: ["ck", "ck-input", "ck-input-text", buttonTextBind.if("hasError", "ck-error")],
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
		buttonTextView.label = "Button text";
		buttonTextView.on("input", () => {
			const model = this.editor.model;
			const selectedElement = this.selectedElement;

			model.change((writer) => {
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
				class: ["ck", "ck-input", "ck-input-text", linkToBind.if("hasError", "ck-error")],
				id: linkToBind.to("id"),
				placeholder: linkToBind.to("placeholder"),
				readonly: false,
				"aria-invalid": linkToBind.if("hasError", true),
				"aria-describedby": linkToBind.to("ariaDescribedById"),
			},
			on: {
				input: linkToBind.to("input"),
			},
		});
		linkToView.label = "Link to";
		linkToView.on("input", () => {
			const model = this.editor.model;
			const selectedElement = this.selectedElement;

			model.change((writer) => {
				if (!selectedElement) return;

				const inputValue = linkToView.element.value.trim();

				// Set the 'href' attribute to the new inputValue
				writer.setAttribute("href", inputValue, selectedElement);
			});
		});

		return {
			buttonTextView,
			linkToView,
		};
	}
}

export default class CTAButtonForm extends Plugin {
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

	_showUI(selectedElement) {
		this._addFormView(selectedElement);

		this._balloon.showStack("main");
	}

	_createFormView() {
		const editor = this.editor;
		const mathCommand = editor.commands.get("math");

		const formView = new MainFormView(editor.locale, editor);

		// formView.mathInputView.bind("value").to(mathCommand, "value");

		// // Form elements should be read-only when corresponding commands are disabled.
		// formView.mathInputView.bind("isReadOnly").to(mathCommand, "isEnabled", (value) => !value);

		// Listen to cancel button click
		this.listenTo(formView, "cancel", () => {
			this._closeFormView();
		});

		// Close plugin ui, if esc is pressed (while ui is focused)
		formView.keystrokes.set("esc", (data, cancel) => {
			this.formView.fire("submit");
			this._closeFormView();
		});

		formView.keystrokes.set("Enter", (data, cancel) => {
			this.formView.fire("submit");
			this._closeFormView();
		});

		this.listenTo(formView, "updatedMath", () => {
			this._balloon.updatePosition(this._getBalloonPositionData());
		});

		return formView;
	}

	_addFormView(selectedElement) {
		if (this._isFormInPanel) {
			return;
		}

		const editor = this.editor;

		this._balloon.add({
			view: this.formView,
			position: this._getBalloonPositionData(),
			balloonClassName: "ck-math-balloon",
		});

		this.formView.buttonTextView.select();
		this.formView.selectedElement = selectedElement;

		// Set buttonText to the text content of selectedElement
		const buttonText = selectedElement.getChild(0).data;
		this.formView.buttonText = buttonText;

		// Set linkTo to the 'data-href' attribute of the selectedElement
		const linkTo = selectedElement.getAttribute("href");
		this.formView.linkTo = linkTo;
	}

	_hideUI() {
		if (!this._isFormInPanel) {
			return;
		}

		const editor = this.editor;

		this.stopListening(editor.ui, "update");
		this.stopListening(this._balloon, "change:visibleView");

		editor.editing.view.focus();

		// Remove form first because it's on top of the stack.
		this._removeFormView();
	}

	_closeFormView() {
		const mathCommand = this.editor.commands.get("math");
		if (mathCommand.value !== undefined) {
			this._removeFormView();
		} else {
			this._hideUI();
		}
	}

	_removeFormView() {
		if (this._isFormInPanel) {
			this._balloon.remove(this.formView);

			this.editor.editing.view.focus();
		}
	}

	_getBalloonPositionData() {
		const view = this.editor.editing.view;
		const viewDocument = view.document;
		const target = view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange());
		return { target };
	}

	_getSelectedLaTeXElement() {
		const selection = this.editor.model.document.selection;
		const selectedElement = selection.getSelectedElement();
		if (selectedElement && selectedElement.is("element", "ctaButton")) {
			return selectedElement;
		}
		return null;
	}

	_enableUserBalloonInteractions() {
		const viewDocument = this.editor.editing.view.document;

		// Handle click on view document and show panel when selection is placed inside the latex element
		this.listenTo(viewDocument, "click", () => {
			console.log("Received click");
			const selectedElement = this._getSelectedLaTeXElement();
			if (selectedElement) {
				console.log("Found element", selectedElement);
				// Then show panel but keep focus inside editor editable.
				this._showUI(selectedElement);
			}
		});

		// Close on click outside of balloon panel element.
		clickOutsideHandler({
			emitter: this.formView,
			activator: () => true,
			contextElements: [this._balloon.view.element],
			callback: () => {
				console.log("clicked outside");
				this._closeFormView();
				// this.formView.fire("submit")
			},
		});
	}

	get _isUIVisible() {
		const visibleView = this._balloon.visibleView;

		return visibleView == this.formView;
	}

	get _isFormInPanel() {
		return this._balloon.hasView(this.formView);
	}
}
