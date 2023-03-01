import View from '@ckeditor/ckeditor5-ui/src/view';
import LabeledFieldView from '@ckeditor/ckeditor5-ui/src/labeledfield/labeledfieldview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { createLabeledInputText } from '@ckeditor/ckeditor5-ui/src/labeledfield/utils';
import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';
import { icons } from '@ckeditor/ckeditor5-core';

export default class FormView extends View {
  constructor( locale ) {
    super( locale );
    
    this.textInputView = this._createInput( 'Button text' );
    this.linkInputView = this._createInput( 'Link to' );
    
    // alignment buttons are handled in buttonUI.js _createFormView()
    this.leftAlignButtonView = this._createButton(
      'Left', 'ck-button-align-left', icons.alignLeft
    );
    this.leftAlignButtonView.delegate( 'execute' ).to( this, 'left-align' );
    this.centerAlignButtonView = this._createButton(
      'Center', 'ck-button-align-center', icons.alignCenter
    );
    this.centerAlignButtonView.delegate( 'execute' ).to( this, 'center-align' );
    
    this.removeButtonView = this._createButton(
      'Remove', ''
    );
    // Delegate ButtonView#execute to FormView#remove.
    this.removeButtonView.delegate( 'execute' ).to( this, 'remove' );
  
    this.saveButtonView = this._createButton(
      'Save', ''
    );
    // Set the type to 'submit', which will trigger
    // the submit event on entire form when clicked.
    this.saveButtonView.type = 'submit';
    
    this.childViews = this.createCollection( [
      this.textInputView,
      this.linkInputView,
      this.leftAlignButtonView,
      this.centerAlignButtonView,
      this.removeButtonView,
      this.saveButtonView,
    ] );
    
    this.setTemplate({
      tag: 'form',
      attributes: {
          class: [ 'ck', 'ck-customButton-form' ],
          tabindex: '-1'
      },
      children: this.childViews
    });
  }

  get text() {
    return this.textInputView.fieldView.value;
  }

  set text( text ) {
    this.textInputView.fieldView.value = text;
  }

  get link() {
    return this.linkInputView.fieldView.value;
  }

  set link( link ) {
    this.linkInputView.fieldView.value = link;
  }
  
  get alignment() {
    // the state of the buttons decides what the current alignment is
    return this.centerAlignButtonView.isOn ? 'center' : 'left'
  }

  set alignment( alignment ) {
    if (alignment === 'center') {
      this.centerAlignButtonView.isOn = true;
      this.leftAlignButtonView.isOn = false;
    } else {
      this.centerAlignButtonView.isOn = false;
      this.leftAlignButtonView.isOn = true;
    }
  }

  render() {
    super.render();

    // Submit the form when the user clicked the save button
    // or pressed enter in the input.
    submitHandler( {
        view: this
    } );
  }
  
  focus() {
    this.childViews.first.focus();
  }
  
  _createInput( label ) {
    const labeledInput = new LabeledFieldView( this.locale, createLabeledInputText );
    labeledInput.label = label;
    return labeledInput;
  }
  
  _createButton( label, className, icon=null ) {
    const button = new ButtonView();

    button.set( {
      label,
      icon,
      withText: true,
      class: className,
      isOn: false
    } );

    return button;
  }

}
