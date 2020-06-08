/* eslint-disable no-tabs */
import Command from '@ckeditor/ckeditor5-core/src/command';
import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {
	execute( equation, display, outputType, forceOutputType ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		model.change( writer => {
			if ( selectedElement && ( selectedElement.is( 'mathtex' ) || selectedElement.is( 'mathtex-display' ) ) ) {
				// Update selected element
				const typeAttr = selectedElement.getAttribute( 'type' );
				const existingEquation = selectedElement.getAttribute( 'equation' );

				// Only update the element if the equation has changed
				if ( existingEquation !== equation ) {
					// Use already set type if found and is not forced
					const type = forceOutputType ? outputType : typeAttr || outputType;
					if ( equation ) {
						const mathtex = writer.createElement( display ? 'mathtex-display' : 'mathtex', { equation, type } );
						model.insertContent( mathtex );
						writer.setSelection( mathtex, 'after' );
					} else {
						writer.remove( selectedElement );
					}
				}
			} else {
				// Create new model element
				const mathtex = writer.createElement( display ? 'mathtex-display' : 'mathtex', { equation, type: outputType } );
				model.insertContent( mathtex );
				writer.setSelection( mathtex, 'after' );
			}
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;

		const isAllowed = model.schema.checkChild( selection.focus.parent, 'mathtex' ) ||
			model.schema.checkChild( selection.focus.parent, 'mathtex-display' );
		this.isEnabled = isAllowed;

		const selectedEquation = getSelectedMathModelWidget( selection );
		if ( selectedEquation ) {
			this.value = selectedEquation.getAttribute( 'equation' );
			this.display = selectedEquation.is( 'mathtex-display ' ) ? true : false;
		} else {
			this.value = null;
			this.display = null;
		}
	}
}
