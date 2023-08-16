

/* eslint-disable no-tabs */
export function HeaderAnchorTags( editor ) {
  editor.conversion.for( 'downcast' ).add( dispatcher => {
    dispatcher.on( 'insert:heading1', ( evt, data, conversionApi ) => {
  
      const viewWriter = conversionApi.writer;
      console.log( 'data', data );
      console.log( 'conversionApi', conversionApi );
      console.log( 'viewWriter', viewWriter );
      viewWriter.setAttribute( 'id', `asdfasdfasdf`, conversionApi.mapper.toViewElement(data.item ) )
    } );
  } );
}



