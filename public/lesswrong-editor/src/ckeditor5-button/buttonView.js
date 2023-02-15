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
    
    this.leftAlignButtonView = this._createButton(
      'Left', icons.alignLeft, 'ck-button-align-left', true
    );
    this.leftAlignButtonView.delegate( 'execute' ).to( this, 'left-align' );
    this.centerAlignButtonView = this._createButton(
      'Center', icons.alignCenter, 'ck-button-align-center', true
    );
    this.centerAlignButtonView.delegate( 'execute' ).to( this, 'center-align' );
    // Create the save and cancel buttons.
    this.saveButtonView = this._createButton(
      'Save', icons.check, 'ck-button-save'
    );
    //   Set the type to 'submit', which will trigger
    // the submit event on entire form when clicked.
    this.saveButtonView.type = 'submit';

    this.cancelButtonView = this._createButton(
      'Cancel', icons.cancel, 'ck-button-cancel'
    );
    // Delegate ButtonView#execute to FormView#cancel.
    this.cancelButtonView.delegate( 'execute' ).to( this, 'cancel' );
    
    this.childViews = this.createCollection( [
      this.textInputView,
      this.linkInputView,
      this.leftAlignButtonView,
      this.centerAlignButtonView,
      this.saveButtonView,
      this.cancelButtonView
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
  
  _createButton( label, icon, className, withText=false ) {
    const button = new ButtonView();

    button.set( {
        label,
        icon,
        withText,
        tooltip: !withText,
        class: className,
        isOn: false
    } );


    return button;
  }

}
