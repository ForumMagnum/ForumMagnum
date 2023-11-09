/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

// @ts-check (uses JSDoc types for type checking)

/**
 * @module binaryquestion/ui/binaryquestionformview
 */

import { icons } from '@ckeditor/ckeditor5-core';
import {
	ButtonView,
	FocusCycler,
	LabeledFieldView,
	SwitchButtonView,
	View,
	ViewCollection,
	createLabeledInputText,
	injectCssTransitionDisabler,
	submitHandler
} from '@ckeditor/ckeditor5-ui';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';
import DateInputView from './dateinputview';

// See: #8833.
// eslint-disable-next-line ckeditor5-rules/ckeditor-imports
import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
// import '../../theme/binaryquestionform.css';

/**
 * @typedef {import('../insertbinaryquestioncommand').default} InsertBinaryQuestionCommand
 * @typedef {import('@ckeditor/ckeditor5-utils').Locale} Locale
 */

/**
 * The binaryquestion form view controller class.
 *
 * See {@binaryquestion module:binaryquestion/ui/binaryquestionformview~BinaryQuestionFormView}.
 *
 * @extends View
 * @typedef {ReturnType<InstanceType<typeof BinaryQuestionFormView>['_createTitleInput']> } TitleInputView
 */
export default class BinaryQuestionFormView extends View {
	/**
	 * Creates an instance of the {@binaryquestion module:binaryquestion/ui/binaryquestionformview~BinaryQuestionFormView} class.
	 *
	 * Also see {@binaryquestion #render}.
	 *
	 * @param {Locale} [locale] The localization services instance.
	 * @param {InsertBinaryQuestionCommand} binaryquestionCommand Reference to {@binaryquestion module:binaryquestion/binaryquestioncommand~BinaryQuestionCommand}.
	 */
	constructor( locale, binaryquestionCommand ) {
		super( locale );

		const t = locale.t;

		/**
		 * Tracks information about DOM focus in the form.
		 *
		 * @readonly
		 * @type {FocusTracker}
		 */
		this.focusTracker = new FocusTracker();

		/**
		 * An instance of the {@binaryquestion module:utils/keystrokehandler~KeystrokeHandler}.
		 *
		 * @readonly
		 * @type {KeystrokeHandler}
		 */
		this.keystrokes = new KeystrokeHandler();

		/**
		 * The URL input view.
		 * 
		 */
		this.titleInputView = this._createTitleInput();

		this.resolvesByInputView = this._createResolvesByInput();

		/**
		 * The Save button view.
		 */
		this.saveButtonView = this._createButton( t( 'Save' ), icons.check, 'ck-button-save' );
		this.saveButtonView.type = 'submit';

		/**
		 * The Cancel button view.
		 */
		this.cancelButtonView = this._createButton( t( 'Cancel' ), icons.cancel, 'ck-button-cancel', 'cancel' );

		/**
		 * A collection of {@binaryquestion module:ui/button/switchbuttonview~SwitchButtonView},
		 * which corresponds to {@binaryquestion module:binaryquestion/binaryquestioncommand~BinaryQuestionCommand#manualDecorators manual decorators}
		 * configured in the editor.
		 *
		 * @private
		 * @readonly
		 * @type {module:ui/viewcollection~ViewCollection}
		 */
		// this._manualDecoratorSwitches = this._createManualDecoratorSwitches( binaryquestionCommand );

		/**
		 * A collection of child views in the form.
		 *
		 * @readonly
		 * @type {ViewCollection}
		 */
		this.children = this._createFormChildren( );

		/**
		 * A collection of views that can be focused in the form.
		 *
		 * @readonly
		 * @protected
		 * @type {ViewCollection}
		 */
		this._focusables = new ViewCollection();

		/**
		 * Helps cycling over {@binaryquestion #_focusables} in the form.
		 *
		 * @readonly
		 * @protected
		 * @type {FocusCycler}
		 */
		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				// Navigate form fields backwards using the Shift + Tab keystroke.
				focusPrevious: 'shift + tab',

				// Navigate form fields forwards using the Tab key.
				focusNext: 'tab'
			}
		} );

		const classList = [ 'ck', 'ck-binaryquestion-form', 'ck-responsive-form' ];

		// if ( binaryquestionCommand.manualDecorators.length ) {
		// 	classList.push( 'ck-binaryquestion-form_layout-vertical', 'ck-vertical-form' );
		// }

		this.setTemplate( {
			tag: 'form',

			attributes: {
				class: classList,

				// https://github.com/ckeditor/ckeditor5-binaryquestion/issues/90
				tabindex: '-1'
			},

			children: this.children
		} );

		injectCssTransitionDisabler( this );
	}

	/**
	 * Obtains the state of the {@binaryquestion module:ui/button/switchbuttonview~SwitchButtonView switch buttons} representing
	 * {@binaryquestion module:binaryquestion/binaryquestioncommand~BinaryQuestionCommand#manualDecorators manual binaryquestion decorators}
	 * in the {@binaryquestion module:binaryquestion/ui/binaryquestionformview~BinaryQuestionFormView}.
	 *
	 * @returns {Object.<String,Boolean>} Key-value pairs, where the key is the name of the decorator and the value is
	 * its state.
	 */
	getDecoratorSwitchesState() {
		return []
		// return Array.from( this._manualDecoratorSwitches ).reduce( ( accumulator, switchButton ) => {
		// 	accumulator[ switchButton.name ] = switchButton.isOn;
		// 	return accumulator;
		// }, {} );
	}

	/**
	 * @inheritDoc
	 */
	render() {
		super.render();

		submitHandler( {
			view: this
		} );

		const childViews = [
			this.titleInputView,
			this.resolvesByInputView,
			this.saveButtonView,
			this.cancelButtonView
		];

		childViews.forEach( v => {
			// Register the view as focusable.
			this._focusables.add( v );

			// Register the view in the focus tracker.
			this.focusTracker.add( v.element );
		} );

		// Start listening for the keystrokes coming from #element.
		this.keystrokes.listenTo( this.element );
	}

	/**
	 * @inheritDoc
	 */
	destroy() {
		super.destroy();

		this.focusTracker.destroy();
		this.keystrokes.destroy();
	}

	/**
	 * Focuses the fist {@binaryquestion #_focusables} in the form.
	 */
	focus() {
		this._focusCycler.focusFirst();
	}

	/**
	 * Creates a labeled input view.
	 *
	 * @private
	 * @returns {LabeledFieldView} Labeled field view instance.
	 */
	_createTitleInput() {
		const t = this.locale.t;
		const labeledInput = new LabeledFieldView( this.locale, createLabeledInputText );

		labeledInput.label = t( 'Binary Question Title' );

		return labeledInput;
	}

	/**
	 * Creates a labeled input view.
	 *
	 * @private
	 * @returns {LabeledFieldView} Labeled field view instance.
	 */
	_createResolvesByInput() {
		const t = this.locale.t;
		const labeledInput = new LabeledFieldView( this.locale, createLabeledInputDate );

		labeledInput.label = t( 'Resolution date' );

		return labeledInput;
	}
	

	/**
	 * Creates a button view.
	 *
	 * @private
	 * @param {String} label The button label.
	 * @param {String} icon The button icon.
	 * @param {String} className The additional button CSS class name.
	 * @param {String} [eventName] An event name that the `ButtonView#execute` event will be delegated to.
	 * @returns {ButtonView} The button view instance.
	 */
	_createButton( label, icon, className, eventName ) {
		const button = new ButtonView( this.locale );

		button.set( {
			label,
			icon,
			tooltip: true
		} );

		button.extendTemplate( {
			attributes: {
				class: className
			}
		} );

		if ( eventName ) {
			button.delegate( 'execute' ).to( this, eventName );
		}

		return button;
	}

	/**
	 * Populates {@binaryquestion module:ui/viewcollection~ViewCollection} of {@binaryquestion module:ui/button/switchbuttonview~SwitchButtonView}
	 * made based on {@binaryquestion module:binaryquestion/binaryquestioncommand~BinaryQuestionCommand#manualDecorators}.
	 *
	 * @private
	 * @param {BinaryQuestionCommand} binaryquestionCommand A reference to the binaryquestion command.
	 * @returns {ViewCollection} of switch buttons.
	 */
	_createManualDecoratorSwitches( binaryquestionCommand ) {
		const switches = this.createCollection();

		for ( const manualDecorator of binaryquestionCommand.manualDecorators ) {
			const switchButton = new SwitchButtonView( this.locale );

			switchButton.set( {
				name: manualDecorator.id,
				label: manualDecorator.label,
				withText: true
			} );

			switchButton.bind( 'isOn' ).toMany( [ manualDecorator, binaryquestionCommand ], 'value', ( decoratorValue, commandValue ) => {
				return commandValue === undefined && decoratorValue === undefined ? manualDecorator.defaultValue : decoratorValue;
			} );

			switchButton.on( 'execute', () => {
				manualDecorator.set( 'value', !switchButton.isOn );
			} );

			switches.add( switchButton );
		}

		return switches;
	}

	/**
	 * Populates the {@binaryquestion #children} collection of the form.
	 *
	 * If {@binaryquestion module:binaryquestion/binaryquestioncommand~BinaryQuestionCommand#manualDecorators manual decorators} are configured in the editor, it creates an
	 * additional `View` wrapping all {@binaryquestion #_manualDecoratorSwitches} switch buttons corresponding
	 * to these decorators.
	 *
	 * @private
	 * @returns {ViewCollection} The children of binaryquestion form view.
	 */
	_createFormChildren() {
		const children = this.createCollection();

		children.add( this.titleInputView );
		children.add( this.resolvesByInputView );

		// if ( manualDecorators.length ) {
		// 	const additionalButtonsView = new View();

		// 	additionalButtonsView.setTemplate( {
		// 		tag: 'ul',
		// 		children: this._manualDecoratorSwitches.map( switchButton => ( {
		// 			tag: 'li',
		// 			children: [ switchButton ],
		// 			attributes: {
		// 				class: [
		// 					'ck',
		// 					'ck-list__item'
		// 				]
		// 			}
		// 		} ) ),
		// 		attributes: {
		// 			class: [
		// 				'ck',
		// 				'ck-reset',
		// 				'ck-list'
		// 			]
		// 		}
		// 	} );
		// 	children.add( additionalButtonsView );
		// }

		children.add( this.saveButtonView );
		children.add( this.cancelButtonView );

		return children;
	}
}

/**
 * Fired when the form view is submitted (when one of the children triggered the submit event),
 * for example with a click on {@binaryquestion #saveButtonView}.
 *
 * @event submit
 */

/**
 * Fired when the form view is canceled, for example with a click on {@binaryquestion #cancelButtonView}.
 *
 * @event cancel
 */


export function createLabeledInputDate( labeledFieldView, viewUid, statusUid ) {
	const inputView = new DateInputView( labeledFieldView.locale );

	inputView.set( {
		id: viewUid,
		ariaDescribedById: statusUid
	} );

	inputView.bind( 'isReadOnly' ).to( labeledFieldView, 'isEnabled', value => !value );
	inputView.bind( 'hasError' ).to( labeledFieldView, 'errorText', value => !!value );

	inputView.on( 'input', () => {
		// UX: Make the error text disappear and disable the error indicator as the user
		// starts fixing the errors.
		labeledFieldView.errorText = null;
	} );

	labeledFieldView.bind( 'isEmpty', 'isFocused', 'placeholder' ).to( inputView );

	return inputView;
}