/* eslint-disable no-tabs */
import View from '@ckeditor/ckeditor5-ui/src/view';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';
import InputTextView from '@ckeditor/ckeditor5-ui/src/inputtext/inputtextview';
import type { Locale } from "@ckeditor/ckeditor5-utils";

import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';

import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';

import { extractDelimiters, hasDelimiters, resizeInputElement } from '../utils';

import MathView from './mathview';

import '../mathform.css';

export default class MainFormView extends View {
	mathInputView: InputTextView
	previewEnabled: boolean
	mathView: MathView
	focusTracker: FocusTracker
	keystrokes: KeystrokeHandler
	_focusables: AnyBecauseTodo
	_focusCycler: FocusCycler

	constructor(locale: Locale, engine: AnyBecauseTodo, previewEnabled: boolean, previewUid: string|null) {
		super( locale );
		// Create key event & focus trackers
		this._createKeyAndFocusTrackers();

		// Equation input
		this.mathInputView = this._createMathInput();

		this.previewEnabled = previewEnabled;

		let children: (InputTextView|MathView)[] = [];
		if ( this.previewEnabled ) {
			// Math element
			this.mathView = new MathView( engine, locale, previewUid );
			this.listenTo( this.mathView, 'updatedMath', () => {
				this.fire( 'updatedMath' );
			} );

			children = [
				this.mathInputView,
				this.mathView
			];
		} else {
			children = [
				this.mathInputView
			];
		}

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
			this.mathInputView,
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

	get equation() {
		return this.mathInputView.element.value;
	}

	set equation( equation ) {
		this.mathInputView.element.value = equation;
		if ( this.previewEnabled ) {
			this.mathView.value = equation;
		}
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

	_createMathInput() {
		// Create equation input
		const inputView = new InputTextView( this.locale );
		const bind = inputView.bindTemplate;
		inputView.setTemplate( {
			tag: 'textarea',
			attributes: {
				cols: 1,
				rows: 1,
				type: 'text',
				class: [
					'ck',
					'ck-input',
					'ck-input-text',
					bind.if( 'hasError', 'ck-error' )
				],
				id: bind.to( 'id' ),
				placeholder: bind.to( 'placeholder' ),
				readonly: bind.to( 'isReadOnly' ),
				'aria-invalid': bind.if( 'hasError', true ),
				'aria-describedby': bind.to( 'ariaDescribedById' )
			},
			on: {
				input: bind.to( 'input' )
			}
		} );
		inputView.on( 'input', () => {
			if ( this.previewEnabled ) {
				const equationInput = inputView.element.value.trim();
				// Resize input element to fit content
				resizeInputElement( inputView.element );
				// If input has delimiters
				if ( hasDelimiters( equationInput ) ) {
					// Get equation without delimiters
					const params = extractDelimiters( equationInput );

					// Remove delimiters from input field
					inputView.element.value = params.equation;

					// Update preview view
					this.mathView.value = params.equation;
				} else {
					this.mathView.value = equationInput;
				}
			}
		} );

		return inputView;
	}
}
