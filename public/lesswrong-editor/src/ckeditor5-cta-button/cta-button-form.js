/* eslint-disable no-tabs */
import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ClickObserver from "@ckeditor/ckeditor5-engine/src/view/observer/clickobserver";
import ContextualBalloon from "@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon";
import clickOutsideHandler from "@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler";

import View from '@ckeditor/ckeditor5-ui/src/view';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';
import InputTextView from '@ckeditor/ckeditor5-ui/src/inputtext/inputtextview';

import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';

import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';

class MainFormView extends View {
	constructor( locale ) {
		super( locale );
		// Create key event & focus trackers
		this._createKeyAndFocusTrackers();

		this.selectedElement = null;

		// Equation input
		const { buttonText, linkTo } = this._createInputs();
		this.buttonText = buttonText
		this.linkTo = linkTo

		this.previewEnabled = true;

		let children = [];
		children = [
			buttonText, linkTo
		];

		// Add UI elements to template
		this.setTemplate( {
			tag: 'form',
			attributes: {
				class: [
					'ck',
					'ck-math-form',
				],
				tabindex: '-1',
				spellcheck: 'false'
			},
			children: [
				{
					tag: 'div',
					attributes: {
						class: [
							'ck-math-view'
						]
					},
					children
				},
			],
		} );
	}

	render() {
		super.render();

		// Prevent default form submit event & trigger custom 'submit'
		submitHandler( {
			view: this,
		} );

		// Register form elements to focusable elements
		const childViews = [
			this.buttonText,
			this.linkTo
		];

		childViews.forEach( v => {
			this._focusables.add( v );
			this.focusTracker.add( v.element );
		} );

		// Listen to keypresses inside form element
		this.keystrokes.listenTo( this.element );
	}

	focus() {
		this._focusCycler.focusFirst();
	}

	_createKeyAndFocusTrackers() {
		this.focusTracker = new FocusTracker();
		this.keystrokes = new KeystrokeHandler();
		this._focusables = new ViewCollection();

		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				focusPrevious: 'shift + tab',
				focusNext: 'tab'
			}
		} );
	}

	_createInputs() {
		// Create 'Button text' input
		const buttonText = new InputTextView(this.locale);
		const buttonTextBind = buttonText.bindTemplate;
		buttonText.setTemplate({
			tag: 'input',
			attributes: {
				type: 'text',
				class: [
					'ck',
					'ck-input',
					'ck-input-text',
					buttonTextBind.if('hasError', 'ck-error')
				],
				id: buttonTextBind.to('id'),
				placeholder: buttonTextBind.to('placeholder'),
				readonly: false,
				'aria-invalid': buttonTextBind.if('hasError', true),
				'aria-describedby': buttonTextBind.to('ariaDescribedById')
			},
			on: {
				input: buttonTextBind.to('input')
			}
		});
		buttonText.label = 'Button text';
		buttonText.on('input', () => {
			// TODO: Handle input for 'Button text'
		});

		// Create 'Link to' input
		const linkTo = new InputTextView(this.locale);
		const linkToBind = linkTo.bindTemplate;
		linkTo.setTemplate({
			tag: 'input',
			attributes: {
				type: 'text',
				class: [
					'ck',
					'ck-input',
					'ck-input-text',
					linkToBind.if('hasError', 'ck-error')
				],
				id: linkToBind.to('id'),
				placeholder: linkToBind.to('placeholder'),
				readonly: false,
				'aria-invalid': linkToBind.if('hasError', true),
				'aria-describedby': linkToBind.to('ariaDescribedById')
			},
			on: {
				input: linkToBind.to('input')
			}
		});
		linkTo.label = 'Link to';
		linkTo.on('input', (e) => {
			// TODO: Handle input for 'Link to'
			console.log(e)
			console.log(this.selectedElement)
		});

		// // Create 'Alignment' radio buttons
		// const alignmentView = new View();
		// const alignmentLeft = new RadioView(this.locale);
		// const alignmentCenter = new RadioView(this.locale);
		// const alignmentBind = alignmentView.bindTemplate;

		// alignmentLeft.set({
		// 	name: 'alignment',
		// 	value: 'left',
		// 	label: 'Left'
		// });
		// alignmentCenter.set({
		// 	name: 'alignment',
		// 	value: 'center',
		// 	label: 'Center'
		// });

		// alignmentView.setTemplate({
		// 	tag: 'div',
		// 	children: [alignmentLeft, alignmentCenter],
		// 	attributes: {
		// 		class: ['ck', 'ck-input', 'ck-input-radio']
		// 	}
		// });

		// alignmentLeft.on('change', () => {
		// 	// TODO: Handle change for 'Left' alignment
		// });
		// alignmentCenter.on('change', () => {
		// 	// TODO: Handle change for 'Center' alignment
		// });

		return {
			buttonText,
			linkTo,
			// alignmentView
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

		const formView = new MainFormView(editor.locale);

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
		const mathCommand = editor.commands.get("math");

		this._balloon.add({
			view: this.formView,
			position: this._getBalloonPositionData(),
			balloonClassName: "ck-math-balloon",
		});

		if (this._balloon.visibleView === this.formView) {
			this.formView.buttonText.select();
			this.formView.selectedElement = selectedElement
		}

		// this.formView.equation = mathCommand.value || "";

		// // After updating the equation, make sure to resize the input element
		// if (this.formView.mathInputView.element) {
		// 	resizeInputElement(this.formView.mathInputView.element);
		// }
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
			console.log("Received click")
			const selectedElement = this._getSelectedLaTeXElement();
			if (selectedElement) {
				console.log("Found element", selectedElement)
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
				console.log("clicked outside")
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
