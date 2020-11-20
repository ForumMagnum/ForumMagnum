/* eslint-disable no-tabs */
export function SanitizeTags( editor ) {
	editor.conversion.for( 'upcast' ).add( dispatcher => {
		dispatcher.on( 'element:style', ( evt, data, conversionApi ) => {
			const styleElement = data.viewItem;
			conversionApi.consumable.consume( styleElement, { name: true } );
		} );
		dispatcher.on( 'element:span', (evt, data, conversionApi) => {
			const spanElement = data.viewItem;
			if (spanElement.getClassNames && [...spanElement.getClassNames()].includes('MathJax')) {
				conversionApi.consumable.consume( spanElement, { name: true } );
			}
		})
	} );
}
