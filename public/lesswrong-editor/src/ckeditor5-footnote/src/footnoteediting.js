// @ts-check
/**
 * CKEditor dataview nodes can be converted to a output view or an editor view via downcasting
 *  * Upcasting is converting to the platonic ckeditor version.
 *  * Downcasting is converting to the output version.
 */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import InsertFootNoteCommand from './insertfootnotecommand';
import '../theme/placeholder.css';
import '../theme/footnote.css';
import Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import ContainerElement from '@ckeditor/ckeditor5-engine/src/view/containerelement';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
import { QueryMixin } from './utils';

export default class FootNoteEditing extends QueryMixin(Plugin) {
    static get requires() {
        return [ Widget ];
    }

	get root() {
		const root = this.editor.model.document.getRoot();
		if(!root) {
			throw new Error('Document has no root element.')
		}
		return root;
	}

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'InsertFootnote', new InsertFootNoteCommand( this.editor ) );
        
        this._deleteModify();

        this.editor.editing.mapper.on(
            'viewToModelPosition',
			// @ts-ignore -- the type signature of `on` here seem to be just wrong, given how it's used in the source code. 
            viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'noteholder' ) )
        );
        this.editor.editing.mapper.on(
            'viewToModelPosition',
			// @ts-ignore
            viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'footnote-item' ) )
        );
    }

    _deleteModify() {
        const viewDocument = this.editor.editing.view.document;
        const editor = this.editor;
        this.listenTo( viewDocument, 'delete', (evt, data) => {
            const doc = editor.model.document;
            const deleteEle = doc.selection.getSelectedElement();
            const lastPosition = doc.selection.getLastPosition();
            if(!doc.selection.anchor || 
				!doc.selection.focus || 
				!lastPosition) {
                throw new Error('Selection must have at least one range to perform delete operation.');
            }
            const positionParent = lastPosition.parent;
		
			// delete all noteholder references if footnotes section gets deleted
            if (deleteEle !== null && deleteEle.name === "footNoteSection") {
                this.removeHolder(editor, 0);
            }

            if (!positionParent || !(positionParent.parent instanceof ModelElement) || positionParent.parent.name !== "footNoteList") {
                return;
            }

			// don't allow deleting a nonempty footnote without deleting text
            if (positionParent.maxOffset > 1 && doc.selection.anchor.offset <= 1) {
                data.preventDefault();
                evt.stop();
            }

            if ((doc.selection.anchor.offset === 0 && positionParent.maxOffset === 1) || 
				(positionParent.maxOffset === doc.selection.anchor.offset && doc.selection.focus.offset === 0)) {
                const footNoteList = positionParent.parent;
                const index = footNoteList.index;
                const footNoteSection = footNoteList.parent;
				if (
					index === null || 
					!footNoteSection || 
					!(footNoteSection instanceof ModelElement)) 
				throw new Error("footNoteList has an invalid parent section.")

				const subsequentFootNotes = [...doc.model.createRangeIn(footNoteSection).getItems()].slice(index+1);
                for (const [i, child] of subsequentFootNotes.entries()) {
					if(!(child instanceof ModelElement)) {
						continue;
					}
					editor.model.change(writer => {
						const footNoteItem = this.queryDescendantFirst({root: child, predicate: (/** @type {ModelElement} */ element) => element.name === 'footNoteItem'});
						if(!footNoteItem) {
							return;
						}
						writer.setAttribute( 'id', i, footNoteItem);
					} );
				}
                this.removeHolder(editor, index);
                editor.model.change(writer => {
                    if (index === 1) {
                        if (footNoteSection.childCount === 2) {
                            if (footNoteSection.previousSibling === null) {
                                const p = writer.createElement( 'paragraph' );
                                this.editor.model.insertContent( p, writer.createPositionAt( this.root, 0 ));
                                writer.setSelection( p, 'end' );
                                }
                            else {
                                writer.setSelection( footNoteSection.previousSibling, 'end'  );
                            }
                            writer.remove(footNoteSection);
                        }
                        else {
                            writer.setSelection( footNoteList.nextSibling, 'end' );
                        }
                    }
                    else {
                        writer.setSelection( footNoteList.previousSibling, 'end' );
                    }
                    writer.remove(footNoteList);
					if(footNoteSection.maxOffset === 0) {
						writer.remove(footNoteSection);
					}
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
                if (item.type === 'remove' && item.name === 'footNoteSection') {
                    removeHolder(editor, 0);
                }

                if (item.type === 'remove' && item.name === 'footNoteList') {
                    const footNoteSection = item.position.parent;
                    const index = (changes[0].type === 'insert' && changes[0].name === 'footNoteItem') ? 
                                    1 : item.position.path[1];
                    for (var i = index; i < footNoteSection.maxOffset; i ++) {
                        editor.model.change( writer => {
                            writer.setAttribute( 'id', i, footNoteSection.getChild( i ).getChild( 0 ).getChild( 0 ) );
                        } );
                    }
                    removeHolder(editor, index);
                    
                }
            } );
        });*/
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        /***********************************Footnote Section Schema***************************************/
        schema.register( 'footNoteSection', {
            isObject: true,
            allowWhere: '$block',
            allowAttributes: ['id', 'class'],
        } );

        schema.register( 'footNoteList', {
            allowIn: 'footNoteSection',
            allowContentOf: '$root',
            isInline: true,
            allowAttributes: ['id', 'data-footnote-id', 'class'],
        });

        schema.register( 'footNoteItem', {
            allowIn: 'footNoteList',
            allowWhere: '$text',
            isInline: true,
            isObject: true,
            allowAttributes: ['id', 'data-footnote-id', 'class'],
        });
        
        schema.addChildCheck( ( context, childDefinition ) => {
            return !context.endsWith('footNoteList') || childDefinition.name !== 'footNoteSection';
        } );

        /***********************************Footnote Inline Schema***************************************/
        schema.register( 'noteHolder', {
            allowWhere: '$text',
            isInline: true,
            isObject: true,
            allowAttributes: [ 'id', 'data-footnote-id', 'class' ],
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
                classes: 'footnote-section'
            },
            model: ( viewElement, conversionApi ) => {
                const modelWriter = conversionApi.writer;
                const FootNote = modelWriter.createElement( 'footNoteSection' );
                return FootNote;
            }
            
        } );

        // (model → data view)
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'footNoteSection',
            view: {
                name: 'section',
                classes: 'footnote-section'
            }
        } );

        // (model → editing view)
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNoteSection',
            view: ( modelElement, conversionApi ) => {
                const viewWriter = conversionApi.writer;
                const section = viewWriter.createContainerElement( 'section', { class: 'footnote-section' } );
                
                return toWidget( section, viewWriter, { label: 'footnote widget' } );
            }
        } );

        /***********************************Footnote List Conversion************************************/
        
        conversion.for( 'upcast' ).elementToElement( {
            model: ( viewElement, conversionApi ) => {
                const modelWriter = conversionApi.writer;
                return modelWriter.createElement( 'footNoteList' );
            },
            view: {
                name: 'section',
                classes: 'footnotes',
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'footNoteList',
            view: {
                name: 'section',
                classes: 'footnotes',
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNoteList',
            view: ( modelElement, conversionApi ) => {
                const viewWriter = conversionApi.writer;
                // Note: You use a more specialized createEditableElement() method here.
                const section = viewWriter.createEditableElement( 'section', { class: 'footnotes' } );

                return toWidgetEditable( section, viewWriter );
            }
        } );

        /***********************************Footnote Item Conversion************************************/

        conversion.for( 'upcast' ).elementToElement( {
            // How to we find the items to upcast here? The view specifies that
            view: {
                name: 'span',
                classes: 'footnote-item',
            },
            model: ( viewElement, conversionApi ) => {
                const modelWriter = conversionApi.writer;
                const id = viewElement.getAttribute('data-footnote-id');
				if(!id) {
					return null;
				}

                return modelWriter.createElement( 'footNoteItem', { 'data-footnote-id': id } );
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'footNoteItem',
            view: createItemView
        } );
        
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNoteItem',
            view: ( modelElement, conversionApi ) => {
                const viewWriter = conversionApi.writer;
				// @ts-ignore -- The type declaration for DowncastHelpers#elementToElement is incorrect. It expects
				// a view Element where it should expect a model Element.
                const section = createItemView( modelElement, conversionApi );
                return toWidget( section, viewWriter );
            }
        } );
        
		/**
		 * 
		 * @param {Element} modelElement 
		 * @param {DowncastConversionApi} conversionApi 
		 * @returns {ContainerElement}
		 */
        function createItemView( modelElement, conversionApi ) {
            const viewWriter = conversionApi.writer;
            const id = modelElement.getAttribute( 'data-footnote-id' );
			if(!id) {
				throw new Error('Note Holder has no provided Id.')
			}

            const itemView = viewWriter.createContainerElement( 'span', {
                class: 'footnote-item',
                id: `fn${id}`,
				'data-footnote-id': id,
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
            model: ( viewElement, conversionApi ) => {
                const modelWriter = conversionApi.writer;
				const id = viewElement.getAttribute('data-footnote-id');
				if(id === undefined) {
					throw new Error('Note Holder has no provided Id.')
				}

                return modelWriter.createElement( 'noteHolder', { 'data-footnote-id': id } );
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'noteHolder',
            view: ( modelElement, conversionApi ) => {
                const viewWriter = conversionApi.writer;
				// @ts-ignore
                const widgetElement = createPlaceholderView(modelElement, conversionApi);

                // Enable widget handling on a placeholder element inside the editing view.
                return toWidget( widgetElement, viewWriter );
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'noteHolder',
            view: createPlaceholderView
        } );

		/**
		 * @param {Element} modelElement 
		 * @param {DowncastConversionApi} conversionApi 
		 * @returns {ContainerElement}
		 */
        function createPlaceholderView( modelElement, conversionApi ) {
            const viewWriter = conversionApi.writer;
            const id = modelElement.getAttribute('data-footnote-id');
			if(id === null) {
				throw new Error('Note Holder has no provided Id.')
			}

            const placeholderView = viewWriter.createContainerElement( 'span', {
                class: 'noteholder',
				'data-footnote-id': id,
            } );

            // Insert the placeholder name (as a text).
            const innerText = viewWriter.createText(`[${id}]`);
            const link = viewWriter.createContainerElement('a', {href: `#fn${id}`});
            const superscript = viewWriter.createContainerElement('sup');
            viewWriter.insert( viewWriter.createPositionAt( link, 0 ), innerText );
            viewWriter.insert( viewWriter.createPositionAt( superscript, 0 ), link );
            viewWriter.insert( viewWriter.createPositionAt( placeholderView, 0 ), superscript);

            return placeholderView;
        }

        conversion.for( 'editingDowncast' )
        .add(dispatcher => {
            dispatcher.on( 'attribute:data-footnote-id:footNoteItem', this.modelViewChangeItem, { priority: 'high' } );
            dispatcher.on( 'attribute:data-footnote-id:noteHolder', this.modelViewChangeHolder, { priority: 'high' } );
        } );
    }

	/**
	 * @typedef {Object} Data
	 * @property {*} item
	 * @property {string} attributeOldValue
	 * @property {string} attributeNewValue
	 */

	/**
	 * @param {*} _ 
	 * @param {Data} data 
	 * @param {DowncastConversionApi} conversionApi 
	 * @returns 
	 */
	modelViewChangeItem( _, data, conversionApi ) {
		if (!(data.item instanceof ModelElement) || !conversionApi.consumable.consume(data.item, 'attribute:data-footnote-id:footNoteItem')) {
			return;
		}
		
		const itemView = conversionApi.mapper.toViewElement( data.item );
		
		if (data.attributeOldValue === null || !itemView) {
			return;
		}
		// @ts-ignore
		const textNode = this.queryDescendantFirst({root: itemView, mode: 'view', type: 'text'});

		const viewWriter = conversionApi.writer;
		viewWriter.remove(itemView.getChild( 0 ));

		const innerText = viewWriter.createText( data.attributeNewValue + '. ' );
		viewWriter.insert( viewWriter.createPositionAt( itemView, 0 ), innerText );

	}

	/**
	 * @param {*} _ 
	 * @param {Data} data 
	 * @param {DowncastConversionApi} conversionApi 
	 * @returns 
	 */
	modelViewChangeHolder( _, data, conversionApi ) {
		if (!(data.item instanceof ModelElement) || !conversionApi.consumable.consume(data.item, 'attribute:data-footnote-id:noteHolder')) {
			return;
		}

		const noteHolderView = conversionApi.mapper.toViewElement( data.item );
		
		if (data.attributeOldValue === null || !noteHolderView) {
			return;
		}

		const viewWriter = conversionApi.writer;

		//@ts-ignore
		const textNode = this.queryDescendantFirst({root: noteHolderView, type: 'text'});

		if(textNode){
			// @ts-ignore
			viewWriter.remove(textNode);
		}

		const innerText = viewWriter.createText( data.attributeNewValue.toString() );
		viewWriter.insert( viewWriter.createPositionAt( noteHolderView.getChild( 0 ), 0 ), innerText );

	}

	/**
	 * 
	 * @param {Editor} editor 
	 * @param {number} index 
	 */
	removeHolder(editor, index) {
		const removeList = [];
		const root = editor.model.document.getRoot(); 
		if(!root) throw new Error('Document has no root element.');
		const range = editor.model.createRangeIn(root);
		for (const item of range.getItems()) {
			if (item && (item instanceof ModelElement) && item.name === 'noteHolder') {
				const idAsInt = parseInt(item.getAttribute('id') ? '-1' : '');
				if (idAsInt === index || index === 0) {
					removeList.push(item);
				}
				else if (idAsInt > index) {
					editor.model.change( writer => {
						writer.setAttribute( 'id', idAsInt, item );
					});
				}
			}
		}
		for (const item of removeList) {
			editor.model.change( writer => {
				writer.remove( item );
			} );
		}
	}
}
