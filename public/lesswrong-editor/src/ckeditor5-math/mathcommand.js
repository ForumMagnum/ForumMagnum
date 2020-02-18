import Command from '@ckeditor/ckeditor5-core/src/command';
import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {
	execute( equation, display, outputType, forceOutputType ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		model.change( writer => {
			let mathtex;
			if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
				// Update selected element
				const typeAttr = selectedElement.getAttribute( 'type' );

				// Use already set type if found and is not forced
				const type = forceOutputType ? outputType : typeAttr || outputType;

				mathtex = writer.createElement( 'mathtex', { equation, type, display } );
			} else {
				// Create new model element
				mathtex = writer.createElement( 'mathtex', { equation, type: outputType, display } );
			}
			model.insertContent( mathtex );
			writer.setSelection( mathtex, 'on' );
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;

		const isAllowed = model.schema.checkChild( selection.focus.parent, 'mathtex' );
		this.isEnabled = isAllowed;

		const selectedEquation = getSelectedMathModelWidget( selection );
		this.value = selectedEquation ? selectedEquation.getAttribute( 'equation' ) : null;
		this.display = selectedEquation ? selectedEquation.getAttribute( 'display' ) : null;
	}
}
