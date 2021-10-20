/* eslint-disable no-tabs */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import InsertFootNoteCommand from './insertfootnotecommand';
import '../theme/placeholder.css';
import '../theme/footnote.css';

export default class FootNoteEditing extends Plugin {
    static get requires() {
        return [ Widget ];
    }

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'InsertFootnote', new InsertFootNoteCommand( this.editor ) );
        
        this._deleteModify();

        this.editor.editing.mapper.on(
            'viewToModelPosition',
            viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'noteholder' ) )
        );
        this.editor.editing.mapper.on(
            'viewToModelPosition',
            viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'footnote-item' ) )
        );
    }

    _deleteModify() {
        const viewDocument = this.editor.editing.view.document;
        const editor = this.editor;
        this.listenTo( viewDocument, 'delete', ( evt, data ) => {
            const doc = editor.model.document;
            const deleteEle = doc.selection.getSelectedElement();
            const positionParent = doc.selection.getLastPosition().parent;
            console.log(deleteEle);

            if (deleteEle !== null && deleteEle.name === "footNote") {
                console.log(1)
                removeHoder(editor, 0);
            }

            if (positionParent.name === "$root") {
                return
            }

            
            if (positionParent.parent.name !== "footNoteList") {
                return
            }

            if (positionParent.maxOffset > 1 && doc.selection.anchor.offset <= 1) {
                console.log(evt);
                console.log(data);
                data.preventDefault();
                evt.stop();
            }

            if ((doc.selection.anchor.offset === 0 && positionParent.maxOffset === 1) || (positionParent.maxOffset === doc.selection.anchor.offset && doc.selection.focus.offset === 0)) {
                const footNoteList = positionParent.parent;
                const index = footNoteList.index;
                const footNote = footNoteList.parent;
                for (var i = index + 1; i < footNote.maxOffset; i ++) {
                        editor.model.change( writer => {
                            writer.setAttribute( 'id', i - 1, footNote.getChild( i ).getChild( 0 ).getChild( 0 ) );
                        } );
                    }
                removeHoder(editor, index);
                editor.model.change( writer => {
                    if (index === 1) {
                        if (footNote.childCount === 2) {
                            if (footNote.previousSibling === null) {
                                const p = writer.createElement( 'paragraph' );
                                this.editor.model.insertContent( p, writer.createPositionAt( doc.getRoot(), 0 ));
                                writer.setSelection( p, 'end' );
                                }
                            else {
                                writer.setSelection( footNote.previousSibling, 'end'  );
                            }
                            writer.remove(footNote);
                        }
                        else {
                            writer.setSelection( footNoteList.nextSibling, 'end' );
                        }
                    }
                    else {
                        writer.setSelection( footNoteList.previousSibling, 'end' );
                    }
                    writer.remove(footNoteList);
                } );
                data.preventDefault();
                evt.stop();
                
            }
        } , { priority: 'high' });
        /*
        this.editor.model.on( 'deleteContent', () => {
            const editor = this.editor;
            const changes = editor.model.document.differ.getChanges();
            changes.forEach( function(item, index) {
                if (item.type === 'remove' && item.name === 'footNote') {
                    removeHoder(editor, 0);
                }

                if (item.type === 'remove' && item.name === 'footNoteList') {
                    const footNote = item.position.parent;
                    const index = (changes[0].type === 'insert' && changes[0].name === 'footNoteItem') ? 
                                    1 : item.position.path[1];
                    for (var i = index; i < footNote.maxOffset; i ++) {
                        editor.model.change( writer => {
                            writer.setAttribute( 'id', i, footNote.getChild( i ).getChild( 0 ).getChild( 0 ) );
                        } );
                    }
                    removeHoder(editor, index);
                    
                }
            } );
        });*/
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        /***********************************Footnote Section Schema***************************************/
        schema.register( 'footNote', {
            isObject: true,
            allowWhere: '$block',
        } );

        schema.register( 'footNoteTitle', {
            allowIn: 'footNote',
            allowContentOf: '$text',
        });

        schema.register( 'footNoteList', {
            allowIn: 'footNote',
            allowContentOf: '$root',
            isInline: true,
        });

        schema.register( 'footNoteItem', {
            allowIn: 'footNoteList',
            allowWhere: '$text',
            isInline: true,
            isObject: true,
            allowAttributes: [ 'id' ]
        });
        
        schema.addChildCheck( ( context, childDefinition ) => {
            if ( context.endsWith( 'footNoteList' ) && childDefinition.name === 'footNote' ) {
                return false;
            }
        } );

        /***********************************Footnote Inline Schema***************************************/
        schema.register( 'noteHolder', {
            allowWhere: '$text',
            isInline: true,
            isObject: true,
            allowAttributes: [ 'id' ]
        } );
    }

    _defineConverters() {
        const editor = this.editor;
        const conversion = editor.conversion;

        /***********************************Footnote Section Conversion************************************/
        // ((data) view → model)
        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'section',
                classes: 'footnote'
            },            
            model: ( viewElement, modelWriter ) => {
                const FootNote = modelWriter.createElement( 'footNote' );
                return FootNote;
            }
            
        } );

        // (model → data view)
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'footNote',
            view: {
                name: 'section',
                classes: 'footnote'
            }
        } );

        // (model → editing view)
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNote',
            view: ( modelElement, viewWriter ) => {
                const section = viewWriter.createContainerElement( 'section', { class: 'footnote' } );
                
                return toWidget( section, viewWriter, { label: 'footnote widget' } );
            }
        } );

        /***********************************Footnote Title Conversion************************************/

        conversion.for( 'upcast' ).elementToElement( {
            model: 'footNoteTitle',
            view: {
                name: 'h3',
                classes: 'footnote-title',
                style: "display: inline;"
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'footNoteTitle',
            view: createTitleView
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNoteTitle',
            view: ( modelElement, viewWriter ) => {
                const widgetElement = createTitleView( modelElement, viewWriter );
                return toWidget( widgetElement, viewWriter );
            }
        } );

        function createTitleView( modelElement, viewWriter ) {
            const titleView = viewWriter.createContainerElement( 'h3', {
                class: 'footnote-title',
                style: "display: inline;"
            } );

            const innerText = viewWriter.createText( 'Footnotes:' );
            viewWriter.insert( viewWriter.createPositionAt( titleView, 0 ), innerText );

            return titleView;
        }

        /***********************************Footnote List Conversion************************************/
        
        conversion.for( 'upcast' ).elementToElement( {
            model: ( viewElement, modelWriter ) => {
                return modelWriter.createElement( 'footNoteList' );
            },
            view: {
                name: 'section',
                classes: 'footnote-list'
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'footNoteList',
            view: {
                name: 'section',
                classes: 'footnote-list'
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNoteList',
            view: ( modelElement, viewWriter ) => {
                // Note: You use a more specialized createEditableElement() method here.
                const section = viewWriter.createEditableElement( 'section', { class: 'footnote-list' } );

                return toWidgetEditable( section, viewWriter );
            }
        } );

        /***********************************Footnote Item Conversion************************************/

        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'span',
                classes: 'footnote-item'
            },
            model: ( viewElement, modelWriter ) => {
                // Extract the "name" from "{name}".
                const id = viewElement.getChild( 0 ).data.slice( 0, -2 );

                return modelWriter.createElement( 'footNoteItem', { id } );
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'footNoteItem',
            view: createItemView
        } );
        
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNoteItem',
            view: ( modelElement, viewWriter ) => {
                // Note: You use a more specialized createEditableElement() method here.
                const section = createItemView( modelElement, viewWriter );
                return toWidget( section, viewWriter );
            }
        } );
        
        function createItemView( modelElement, viewWriter ) {

            const id = modelElement.getAttribute( 'id' );
            const itemView = viewWriter.createContainerElement( 'span', {
                class: 'footnote-item'
            } );

            const innerText = viewWriter.createText( id + '. ' );
            viewWriter.insert( viewWriter.createPositionAt( itemView, 0 ), innerText );

            return itemView;
        }

        /***********************************Footnote Inline Conversion************************************/

        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'span',
                classes: [ 'noteholder' ]
            },
            model: ( viewElement, modelWriter ) => {
                // Extract the "id" from "[id]".
                const id = viewElement.getChild( 0 ).getChild( 0 ).data.slice( 1, -1 );

                return modelWriter.createElement( 'noteHolder', { id } );
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'noteHolder',
            view: ( modelElement, viewWriter ) => {
                const widgetElement = createPlaceholderView( modelElement, viewWriter );

                // Enable widget handling on a placeholder element inside the editing view.
                return toWidget( widgetElement, viewWriter );
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'noteHolder',
            view: createPlaceholderView
        } );

        // Helper method for both downcast converters.
        function createPlaceholderView( modelElement, viewWriter ) {
            const id = modelElement.getAttribute( 'id' );

            const placeholderView = viewWriter.createContainerElement( 'span', {
                class: 'noteholder'
            } );

            // Insert the placeholder name (as a text).
            const innerText = viewWriter.createText( '[' + id + ']' );
            const sup = viewWriter.createContainerElement( 'sup' );
            viewWriter.insert( viewWriter.createPositionAt( sup, 0 ), innerText );
            viewWriter.insert( viewWriter.createPositionAt( placeholderView, 0 ), sup );

            return placeholderView;
        }

        conversion.for( 'editingDowncast' )
        .add( dispatcher => {
            dispatcher.on( 'attribute:id:footNoteItem', modelViewChangeItem, { priority: 'high' } );
            dispatcher.on( 'attribute:id:noteHolder', modelViewChangeHolder, { priority: 'high' } );
        } );
    }
}

export function modelViewChangeItem( evt, data, conversionApi ) {
    if ( !conversionApi.consumable.consume( data.item, 'attribute:id:footNoteItem' ) ) {
        return;
    }
    if (data.attributeOldValue === null) {
        return;
    }

    const itemView = conversionApi.mapper.toViewElement( data.item );
    const viewWriter = conversionApi.writer;

    viewWriter.remove(itemView.getChild( 0 ));

    const innerText = viewWriter.createText( data.attributeNewValue + '. ' );
    viewWriter.insert( viewWriter.createPositionAt( itemView, 0 ), innerText );

}

export function modelViewChangeHolder( evt, data, conversionApi ) {
    if ( !conversionApi.consumable.consume( data.item, 'attribute:id:noteHolder' ) ) {
        return;
    }
    if (data.attributeOldValue === null) {
        return;
    }

    const itemView = conversionApi.mapper.toViewElement( data.item );
    const viewWriter = conversionApi.writer;

    viewWriter.remove(itemView.getChild( 0 ).getChild( 0 ));

    const innerText = viewWriter.createText( '[' + data.attributeNewValue + ']' );
    viewWriter.insert( viewWriter.createPositionAt( itemView.getChild( 0 ), 0 ), innerText );

}

function removeHoder(editor, index) {
    const removeList = [];
    const range = editor.model.createRangeIn( editor.model.document.getRoot() );
    for ( const value of range.getWalker( { ignoreElementEnd: true } ) ) {
        if (value.item.name === 'noteHolder') {
            if (parseInt(value.item.getAttribute('id')) === index || index === 0) {
                removeList.push(value.item);
            }
            else if (parseInt(value.item.getAttribute('id')) > index) {
                editor.model.change( writer => {
                    writer.setAttribute( 'id', parseInt(value.item.getAttribute('id')) - 1, value.item );
                } );
            }
        }
    }
    for (const item of removeList) {
        editor.model.change( writer => {
            writer.remove( item );
        } );
    }
}
