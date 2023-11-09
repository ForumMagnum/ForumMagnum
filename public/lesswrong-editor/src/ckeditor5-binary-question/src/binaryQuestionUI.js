// @ts-check (uses JSDoc types for type checking)

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
// @ts-ignore-next-line
import { ButtonView, ContextualBalloon } from '@ckeditor/ckeditor5-ui';
import { COMMANDS, TOOLBAR_COMPONENT_NAME, VISUAL_SELECTION_MARKER_NAME } from './constants';
import BinaryQuestionFormView from './ui/binaryQuestionFormView';
import InsertBinaryQuestionCommand from './insertbinaryquestioncommand';
import { defineSchema } from './schema';
import { defineConverters } from './converters';


export default class BinaryQuestionUI extends Plugin {

    static get requires() {
		return [ ContextualBalloon ];
	}

	init() {
		/** @type {import('@ckeditor/ckeditor5-core/src/editor/editorwithui').EditorWithUI} */
		 // @ts-ignore
		const editor = this.editor;
		const t = editor.t;
		editor.commands.add( COMMANDS.insertBinaryQuestion, new InsertBinaryQuestionCommand( editor ) );
		defineSchema(this.editor.model.schema);
		defineConverters(this.editor);
        this.formView = this._createFormView()
        this.actionsView = this._createActionsView();
        this._balloon = editor.plugins.get( ContextualBalloon );


		editor.ui.componentFactory.add( TOOLBAR_COMPONENT_NAME, locale => {
			const command = editor.commands.get( COMMANDS.insertBinaryQuestion );
			if(!command) throw new Error("Command not found.");

            const buttonView = new ButtonView(locale);

            buttonView.set( {
                // The t() function helps localize the editor. All strings enclosed in t() can be
                // translated and change when the language of the editor changes.
                label: t( 'Insert binary question' ),
                withText: true,
                tooltip: true
            } );


            buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			this.listenTo(buttonView, 'execute', () => this._showUI(true))


			return buttonView;
		} );


	}

    _createFormView() {
		const editor = this.editor;
		const binaryQuestionCommand = editor.commands.get( COMMANDS.insertBinaryQuestion );

		const formView = new BinaryQuestionFormView( editor.locale, binaryQuestionCommand );


		formView.titleInputView.fieldView.bind( 'value' ).to( binaryQuestionCommand, 'title' );
		formView.resolvesByInputView.fieldView.bind( 'value' ).to( binaryQuestionCommand, 'resolvesBy' );

		// Form elements should be read-only when corresponding commands are disabled.
		formView.titleInputView.bind( 'isReadOnly' ).to( binaryQuestionCommand, 'isEnabled', value => !value );
		formView.resolvesByInputView.bind( 'isReadOnly' ).to( binaryQuestionCommand, 'isEnabled', value => !value );
		formView.saveButtonView.bind( 'isEnabled' ).to( binaryQuestionCommand );

		// Execute insertBinaryQuestion command after clicking the "Save" button.
		this.listenTo( formView, 'submit', () => {
			const { value: title } = formView.titleInputView.fieldView.element;
			const { value: resolvesBy } = formView.resolvesByInputView.fieldView.element;
			editor.execute( COMMANDS.insertBinaryQuestion ,  title, resolvesBy);
			this._closeFormView();
		} );

		// Hide the panel after clicking the "Cancel" button.
		this.listenTo( formView, 'cancel', () => {
			this._closeFormView();
		} );

		// Close the panel on esc key press when the **form has focus**.
		formView.keystrokes.set( 'Esc', ( data, cancel ) => {
			this._closeFormView();
			cancel();
		} );

		return formView;
	}

    get _isFormInPanel() {
		return this._balloon.hasView( this.formView );
	}

    get _isUIInPanel() {
		return this._isFormInPanel || this._areActionsInPanel;
	}

    get _areActionsInPanel() {
		return this._balloon.hasView( this.actionsView );
	}

    _getBalloonPositionData() {
		const view = this.editor.editing.view;
		const viewDocument = view.document;
		const target = view.domConverter.viewRangeToDom( viewDocument.selection.getFirstRange() );

		return { target };
	}

	_addActionsView() {
		if ( this._areActionsInPanel ) {
			return;
		}

		this._balloon.add( {
			view: this.actionsView,
			position: this._getBalloonPositionData()
		} );
	}


	_showUI( forceVisible = false ) {

		this._addActionsView();

		if ( forceVisible ) {
			this._balloon.showStack( 'main' );
		}

		this._addFormView();

		// Begin responding to ui#update once the UI is added.
		// this._startUpdatingUI();
	}


    _addFormView() {
		if ( this._isFormInPanel ) {
			return;
		}

		const editor = this.editor;
		const binaryQuestionCommand = editor.commands.get( COMMANDS.insertBinaryQuestion );

		this.formView.disableCssTransitions();

		this._balloon.add( {
			view: this.formView,
			position: this._getBalloonPositionData()
		} );

		// Select input when form view is currently visible.
		if ( this._balloon.visibleView === this.formView ) {
			this.formView.urlInputView.fieldView.select();
		}

		this.formView.enableCssTransitions();

		this.formView.urlInputView.fieldView.element.value = binaryQuestionCommand.title || '';
	}

    _createActionsView() {
		// const editor = this.editor;
		// const actionsView = new LinkActionsView( editor.locale );
		// const linkCommand = editor.commands.get( 'link' );
		// const unlinkCommand = editor.commands.get( 'unlink' );

		// actionsView.bind( 'href' ).to( linkCommand, 'value' );
		// actionsView.editButtonView.bind( 'isEnabled' ).to( linkCommand );
		// actionsView.unlinkButtonView.bind( 'isEnabled' ).to( unlinkCommand );

		// // Execute unlink command after clicking on the "Edit" button.
		// this.listenTo( actionsView, 'edit', () => {
		// 	this._addFormView();
		// } );

		// // Execute unlink command after clicking on the "Unlink" button.
		// this.listenTo( actionsView, 'unlink', () => {
		// 	editor.execute( 'unlink' );
		// 	this._hideUI();
		// } );

		// // Close the panel on esc key press when the **actions have focus**.
		// actionsView.keystrokes.set( 'Esc', ( data, cancel ) => {
		// 	this._hideUI();
		// 	cancel();
		// } );

		// // Open the form view on Ctrl+K when the **actions have focus**..
		// actionsView.keystrokes.set( LINK_KEYSTROKE, ( data, cancel ) => {
		// 	this._addFormView();
		// 	cancel();
		// } );

		// return actionsView;
		return this.formView;
	}

	_closeFormView() {
		const binaryQuestionCommand = this.editor.commands.get( COMMANDS.insertBinaryQuestion );

		if ( binaryQuestionCommand.value !== undefined ) {
			this._removeFormView();
		} else {
			this._hideUI();
		}
	}
	
    _removeFormView() {
		if ( this._isFormInPanel ) {
			// Blur the input element before removing it from DOM to prevent issues in some browsers.
			// See https://github.com/ckeditor/ckeditor5/issues/1501.
			this.formView.saveButtonView.focus();
			
			this._balloon.remove( this.formView );
			
			// Because the form has an input which has focus, the focus must be brought back
			// to the editor. Otherwise, it would be lost.
			this.editor.editing.view.focus();
			
			// this._hideFakeVisualSelection();
		}
	}
	
	_hideUI() {
		if ( !this._isUIInPanel ) {
			return;
		}

		const editor = this.editor;

		this.stopListening( editor.ui, 'update' );
		this.stopListening( this._balloon, 'change:visibleView' );

		// Make sure the focus always gets back to the editable _before_ removing the focused form view.
		// Doing otherwise causes issues in some browsers. See https://github.com/ckeditor/ckeditor5-link/issues/193.
		editor.editing.view.focus();

		// Remove form first because it's on top of the stack.
		this._removeFormView();

		// Then remove the actions view because it's beneath the form.
		this._balloon.remove( this.actionsView );

		// this._hideFakeVisualSelection();
	}
}
