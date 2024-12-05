/* eslint-disable no-tabs */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import uid from '@ckeditor/ckeditor5-utils/src/uid';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import MainFormView from './ui/mainformview';

// Need math commands from there
import MathEditing from './mathediting';
import { defaultConfig, getSelectedMathModelWidget, resizeInputElement } from './utils';

import mathIcon from './ckeditor5-math.svg';
import type MathCommand from './mathcommand';

const mathKeystroke = 'Ctrl+4';
const mathDisplayKeystroke = 'Ctrl+M';

export default class MathUI extends Plugin {
	_previewUid: string
	formView: MainFormView
	_balloon: ContextualBalloon

	static get requires() {
		return [ ContextualBalloon, MathEditing ];
	}

	static get pluginName() {
		return 'MathUI';
	}

	init() {
		const editor = this.editor;
		editor.editing.view.addObserver( ClickObserver );

		this._previewUid = `math-preview-${ uid() }`;

		this.formView = this._createFormView();

		this._balloon = editor.plugins.get( ContextualBalloon );

		this._createToolbarMathButton();

		this._enableUserBalloonInteractions();
	}

	destroy() {
		super.destroy();

		this.formView.destroy();

		// Destroy preview element
		const prewviewEl = global.document.getElementById( this._previewUid );
		if ( prewviewEl ) {
			prewviewEl.parentNode.removeChild( prewviewEl );
		}
	}

	_showUI() {
		const editor = this.editor;
		const mathCommand = editor.commands.get('math');

		if ( !mathCommand.isEnabled ) {
			return;
		}

		// When we press Ctrl+4 and have text-selected, initialize the mathCommand
		// (and corresponding menu) with the selected text
		const selection = editor.model.document.selection;
		const range = selection.getFirstRange();
		const selectedItems = range.getItems();
		const concatenatedSelection = Array.from( selectedItems ).map( (item: AnyBecauseTodo) => item.data ? item.data : '' ).join( '' );
		if ( concatenatedSelection && concatenatedSelection.length ) {
			mathCommand.value = concatenatedSelection;
		}

		this._addFormView();

		this._balloon.showStack( 'main' );
	}

	_createFormView() {
		const editor = this.editor;
		const mathCommand = editor.commands.get('math');

		const mathConfig = Object.assign( defaultConfig, this.editor.config.get( 'math' ) );

		const formView = new MainFormView( editor.locale, mathConfig.engine, mathConfig.enablePreview, this._previewUid );

		formView.mathInputView.bind( 'value' ).to( mathCommand, 'value' );

		// Form elements should be read-only when corresponding commands are disabled.
		formView.mathInputView.bind( 'isReadOnly' ).to( mathCommand, 'isEnabled', value => !value );

		// Listen to submit button click
		this.listenTo( formView, 'submit', () => {
			editor.execute( 'math', formView.equation, mathCommand.display, mathConfig.outputType, mathConfig.forceOutputType );
			this._closeFormView();
		} );

		// Listen to cancel button click
		this.listenTo( formView, 'cancel', () => {
			this._closeFormView();
		} );

		// Close plugin ui, if esc is pressed (while ui is focused)
		formView.keystrokes.set( 'esc', ( data, cancel ) => {
			this.formView.fire( 'submit' );
			this._closeFormView();
		} );

		// Close plugin ui, if Tab is pressed (while ui is focused)
		formView.keystrokes.set( 'tab', ( data, cancel ) => {
			this.formView.fire( 'submit' );
			this._closeFormView();
		}, { priority: 'high' } );

		formView.keystrokes.set( 'Enter', ( data, cancel ) => {
			this.formView.fire( 'submit' );
			this._closeFormView();
		});

		this.listenTo( formView, 'updatedMath', () => {
			this._balloon.updatePosition( this._getBalloonPositionData() );
		} );

		return formView;
	}

	_addFormView() {
		if ( this._isFormInPanel ) {
			return;
		}

		const editor = this.editor;
		const mathCommand = editor.commands.get('math');

		this._balloon.add( {
			view: this.formView,
			position: this._getBalloonPositionData(),
			balloonClassName: 'ck-math-balloon'
		} );

		if ( this._balloon.visibleView === this.formView ) {
			this.formView.mathInputView.select();
		}

		this.formView.equation = mathCommand.value || '';

		// After updating the equation, make sure to resize the input element
		if ( this.formView.mathInputView.element ) {
			resizeInputElement( this.formView.mathInputView.element );
		}
	}

	_hideUI() {
		if ( !this._isFormInPanel ) {
			return;
		}

		const editor = this.editor;

		this.stopListening( editor.ui, 'update' );
		this.stopListening( this._balloon, 'change:visibleView' );

		editor.editing.view.focus();

		// Remove form first because it's on top of the stack.
		this._removeFormView();
	}

	_closeFormView() {
		const mathCommand = this.editor.commands.get('math');
		if ( mathCommand.value !== undefined ) {
			this._removeFormView();
		} else {
			this._hideUI();
		}
	}

	_removeFormView() {
		if ( this._isFormInPanel ) {
			this._balloon.remove( this.formView );

			// Hide preview element
			const prewviewEl = global.document.getElementById( this._previewUid );
			if ( prewviewEl ) {
				prewviewEl.style.visibility = 'hidden';
			}

			this.editor.editing.view.focus();
		}
	}

	_getBalloonPositionData() {
		const view = this.editor.editing.view;
		const viewDocument = view.document;
		const target = view.domConverter.viewRangeToDom( viewDocument.selection.getFirstRange() );
		return { target };
	}

	_createToolbarMathButton() {
		const editor = this.editor;
		const mathCommand = editor.commands.get('math');
		const t = editor.t;

		// Handle the `Ctrl+4` keystroke and show the panel.
		editor.keystrokes.set( mathKeystroke, ( keyEvtData, cancel ) => {
			cancel();

			if ( mathCommand.isEnabled ) {
				this._showUI();
			}
		} );

		// Handle the `Ctrl+M` keystroke and show the panel.
		editor.keystrokes.set( mathDisplayKeystroke, ( keyEvtData, cancel ) => {
			// Prevent focusing the search bar in FF and opening new tab in Edge. #153, #154.
			cancel();

			if ( mathCommand.isEnabled ) {
				mathCommand.display = true;
				this._showUI();
			}
		} );

		this.editor.ui.componentFactory.add( 'math', locale => {
			const button = new ButtonView( locale );

			button.isEnabled = true;
			button.label = t( 'Insert math' );
			button.icon = mathIcon;
			button.keystroke = mathKeystroke;
			button.tooltip = true;
			button.isToggleable = true;

			button.bind( 'isEnabled' ).to( mathCommand, 'isEnabled' );

			this.listenTo( button, 'execute', () => this._showUI() );

			return button;
		} );

		this.editor.ui.componentFactory.add( 'mathDisplay', locale => {
			const button = new ButtonView( locale );

			button.isEnabled = true;
			button.label = t( 'Insert display math block' );
			button.icon = mathIcon;
			button.keystroke = mathDisplayKeystroke;
			button.tooltip = true;
			button.isToggleable = true;

			button.bind( 'isEnabled' ).to( mathCommand, 'isEnabled' );

			this.listenTo( button, 'execute', () => {
				mathCommand.display = true;
				this._showUI();
			} );

			return button;
		} );
	}

	_getSelectedLaTeXElement() {
		const selection = this.editor.model.document.selection;
		return getSelectedMathModelWidget( selection );
	}

	_enableUserBalloonInteractions() {
		const viewDocument = this.editor.editing.view.document;

		// Handle click on view document and show panel when selection is placed inside the latex element
		this.listenTo( viewDocument, 'click', () => {
			const selectedElement = this._getSelectedLaTeXElement();
			if ( selectedElement ) {
				// Then show panel but keep focus inside editor editable.
				this._showUI();
			}
		} );

		// Close on click outside of balloon panel element.
		clickOutsideHandler( {
			emitter: this.formView,
			activator: () => this._isFormInPanel,
			contextElements: [ this._balloon.view.element ],
			callback: () => this.formView.fire( 'submit' )
		} );
	}

	get _isUIVisible() {
		const visibleView = this._balloon.visibleView;

		return visibleView == this.formView;
	}

	get _isFormInPanel() {
		return this._balloon.hasView( this.formView );
	}
}
