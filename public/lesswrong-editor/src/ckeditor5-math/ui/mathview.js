import View from '@ckeditor/ckeditor5-ui/src/view';

import { renderEquation } from '../utils';

export default class MathView extends View {
	constructor( engine, locale, previewUid ) {
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
