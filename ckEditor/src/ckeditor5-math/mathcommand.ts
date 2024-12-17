/* eslint-disable no-tabs */
import Command from '@ckeditor/ckeditor5-core/src/command';
import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {
	display: AnyBecauseTodo
	override value: AnyBecauseTodo

	execute( equation: string, display: boolean, outputType: "span"|"script", forceOutputType: boolean) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		model.change( writer => {
			if ( selectedElement && ( selectedElement.is( 'element', 'mathtex' ) || selectedElement.is( 'element', 'mathtex-display' ) ) ) {
				// Update selected element
				const typeAttr = selectedElement.getAttribute( 'type' );
				const existingEquation = selectedElement.getAttribute( 'equation' );

				// Only update the element if the equation has changed
				if ( existingEquation !== equation ) {
					// Use already set type if found and is not forced
					const type = forceOutputType ? outputType : typeAttr || outputType;
					if ( equation ) {
						const mathtex = writer.createElement( display ? 'mathtex-display' : 'mathtex', { equation, type, display } );
						model.insertContent( mathtex );
						writer.setSelection( mathtex, 'after' );
					} else {
						writer.remove( selectedElement );
					}
				}
			} else {
				// Create new model element
				const mathtex = writer.createElement( display ? 'mathtex-display' : 'mathtex', { equation, type: outputType, display } );
				model.insertContent( mathtex );
				writer.setSelection( mathtex, 'after' );
			}
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		this.isEnabled = selectedElement === null || ( selectedElement.is( 'element', 'mathtex' ) ||
				selectedElement.is( 'element', 'mathtex-display' ) );

				
		const selectedEquation = getSelectedMathModelWidget( selection );
		this.value = selectedEquation ? selectedEquation.getAttribute( 'equation' ) : null;
		this.display = selectedEquation ? selectedEquation.getAttribute( 'display' ) : null;
	}
}
