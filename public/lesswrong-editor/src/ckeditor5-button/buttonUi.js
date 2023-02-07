import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui//src/panel/balloon/contextualballoon';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';
import { BUTTON_ELEMENT, INSERT_BUTTON_COMMAND, TOOLBAR_COMPONENT_NAME } from './constants';
import footnoteIcon from './theme/icon.svg';
import FormView from './buttonView';

export default class ButtonUI extends Plugin {
	static get requires() {
		return [ ContextualBalloon ];
	}

	init() {
		const editor = this.editor;
		const translate = editor.t;
		editor.editing.view.addObserver( ClickObserver );
		
		// Create the balloon and the form view.
		this._balloon = this.editor.plugins.get( ContextualBalloon );
		this.formView = this._createFormView();

		editor.ui.componentFactory.add(TOOLBAR_COMPONENT_NAME, () => {
			const command = editor.commands.get(INSERT_BUTTON_COMMAND);
			if(!command) throw new Error("Command not found.");

			const button = new ButtonView();

			button.set( {
				label: translate( 'Button' ),
				icon: footnoteIcon,
				withText: true,
			} );

			button.on('execute', () => {
				this._showUI();
				// editor.execute(INSERT_BUTTON_COMMAND);
			})

			return button;
		});
		this._enableUserBalloonInteractions();
	}
	
	_createFormView() {
		const editor = this.editor;
		const formView = new FormView( editor.locale );
		
		this.listenTo( formView, 'submit', () => {
			const text = formView.textInputView.fieldView.element.value;
			const link = formView.linkInputView.fieldView.element.value;
			
			editor.execute(INSERT_BUTTON_COMMAND, {text, link})

			// editor.model.change( writer => {
			// 		editor.model.insertContent(
			// 				writer.createText( , { abbreviation: text } )
			// 		);
			// } );
			
			// Hide the form view after submit.
			this._hideUI();
		} );
		
		// Hide the form view after clicking the "Cancel" button.
		this.listenTo( formView, 'cancel', () => {
			this._hideUI();
		} );
		
		// Hide the form view when clicking outside the balloon.
		clickOutsideHandler( {
			emitter: formView,
			activator: () => this._balloon.visibleView === formView,
			contextElements: [ this._balloon.view.element ],
			callback: () => this._hideUI()
		} );

		return formView;
	}
	
	_getBalloonPositionData() {
		const view = this.editor.editing.view;
		const viewDocument = view.document;
		let target = null;

		// Set a target position by converting view selection range to DOM.
		target = () => view.domConverter.viewRangeToDom(
				viewDocument.selection.getFirstRange()
		);

		return {
				target
		};
	}
	
	_showUI() {
		this._balloon.add( {
				view: this.formView,
				position: this._getBalloonPositionData()
		} );
		const buttonCommand = this.editor.commands.get('customButton');

		this.formView.text = buttonCommand.text;
		this.formView.link = buttonCommand.link;

		console.log(this.formView);

		this.formView.focus();
	}
	
	_hideUI() {
		this.formView.textInputView.fieldView.value = '';
		this.formView.linkInputView.fieldView.value = '';
		this.formView.element.reset();

		this._balloon.remove( this.formView );

		// Focus the editing view after closing the form view.
		this.editor.editing.view.focus();
	}

	_enableUserBalloonInteractions() {
		const viewDocument = this.editor.editing.view.document;

		// Handle click on view document and show panel when selection is placed inside the latex element
		this.listenTo( viewDocument, 'click', () => {
			const selectedElement = this._getSelectedButtonElement();
			if ( selectedElement ) {
				// Then show panel but keep focus inside editor editable.
				this._showUI();
			}
		} );
	}

	_getSelectedButtonElement() {
		const selection = this.editor.model.document.selection;
		const selectedElement = selection.getSelectedElement();
		if (selectedElement && selectedElement.is( 'element', BUTTON_ELEMENT )) {
			return selectedElement;
		}
		return null;
	}
}
