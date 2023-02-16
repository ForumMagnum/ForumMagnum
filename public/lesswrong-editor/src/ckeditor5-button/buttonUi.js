import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui//src/panel/balloon/contextualballoon';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';
import { BUTTON_ELEMENT, INSERT_BUTTON_COMMAND, TOOLBAR_COMPONENT_NAME } from './constants';
import buttonIcon from './theme/icon.svg';
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
        label: translate( 'Insert button' ),
        icon: buttonIcon,
        tooltip: true,
      } );

      button.on('execute', () => {
        this._showUI();
        editor.execute(INSERT_BUTTON_COMMAND);
      })

      return button;
    });
    this._enableUserBalloonInteractions();
  }
  
  _createFormView() {
    const editor = this.editor;
    const formView = new FormView( editor.locale );
    
    const buttonCommand = this.editor.commands.get(INSERT_BUTTON_COMMAND);
    formView.leftAlignButtonView.bind( 'isSelected' ).to( buttonCommand, 'alignment', val => val !== 'center' );
    formView.centerAlignButtonView.bind( 'isSelected' ).to( buttonCommand, 'alignment', val => val === 'center' );

    this.listenTo( formView, 'left-align', () => {
      this.formView.alignment = 'left';
    } );

    this.listenTo( formView, 'center-align', () => {
      this.formView.alignment = 'center';
    } );
    
    this.listenTo( formView, 'submit', () => {
      const text = formView.textInputView.fieldView.element.value;
      let link = formView.linkInputView.fieldView.element.value;
      if (!text) {
        formView.textInputView.errorText = "Button text is required"
        return;
      }
      if (!link) {
        formView.linkInputView.errorText = 'Link is required'
        return;
      }
      if (!link.startsWith('http')) {
        link = `https://${link}`
      }
      
      editor.execute(INSERT_BUTTON_COMMAND, {text, link, alignment: this.formView.alignment})
      
      // Hide the form view after submit.
      this._hideUI();
    } );
    
    // Hide the form view after clicking the "Cancel" button.
    this.listenTo( formView, 'cancel', () => {
      // clear any errors
      formView.textInputView.errorText = '';
      formView.linkInputView.errorText = '';
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
    const buttonCommand = this.editor.commands.get(INSERT_BUTTON_COMMAND);

    this.formView.text = buttonCommand.text;
    this.formView.link = buttonCommand.link;
    this.formView.alignment = buttonCommand.alignment;

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
