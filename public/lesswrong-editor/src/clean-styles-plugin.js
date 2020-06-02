/* eslint-disable no-tabs */
export function CleanStyleTags( editor ) {
	// Tell the editor that <a target="..."></a> converts into the "linkTarget" attribute in the model.
	editor.conversion.for( 'upcast' ).add( dispatcher => {
		dispatcher.on( 'element:style', ( evt, data, conversionApi ) => {
			const styleElement = data.viewItem;
			conversionApi.consumable.consume( styleElement, { name: true } );
			// Continue after inserted element.
		} );
	} );
}
