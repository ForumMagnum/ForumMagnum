import View from '@ckeditor/ckeditor5-ui/src/view';
import type { Locale } from "@ckeditor/ckeditor5-utils";

import { renderEquation } from '../utils';

export default class MathView extends View {
	engine: AnyBecauseTodo
	previewUid: AnyBecauseTodo
	value: AnyBecauseTodo
	display: AnyBecauseTodo

	constructor(engine: AnyBecauseTodo, locale: Locale, previewUid: string|null) {
		super( locale );

		this.engine = engine;
		this.previewUid = previewUid;

		this.set( 'value', '' );
		this.set( 'display', false );

		this.on( 'change', async () => {
			if ( this.isRendered ) {
				this.updateMath().then( () => {
					this.fire( 'updatedMath' );
				} );
			}
		} );

		this.setTemplate( {
			tag: 'div',
			attributes: {
				id: 'ck-math-preview',
				class: [
					'ck',
					'ck-math-preview'
				],
			}
		} );
	}

	async updateMath() {
		await renderEquation( this.value, this.element, this.engine, this.display, true, 'ck-math-preview' );
	}

	render() {
		super.render();
		this.updateMath();
	}
}
