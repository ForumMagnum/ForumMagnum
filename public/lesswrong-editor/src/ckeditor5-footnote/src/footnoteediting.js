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
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import DocumentFragment from '@ckeditor/ckeditor5-engine/src/model/documentfragment';
import ContainerElement from '@ckeditor/ckeditor5-engine/src/view/containerelement';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
import { QueryMixin } from './utils';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import inlineAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/inlineautoformatediting';

export default class FootNoteEditing extends QueryMixin(Plugin) {
    static get requires() {
        return [ Widget, Autoformat ];
    }

	get rootElement() {
		const rootElement = this.editor.model.document.getRoot();
		if(!rootElement) {
			throw new Error('Document has no rootElement element.')
		}
		return rootElement;
	}

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'InsertFootnote', new InsertFootNoteCommand( this.editor ) );

		this._addAutoformatting();

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

			// If we're at the start of the document
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
						writer.setAttribute( 'data-footnote-id', i+1, footNoteItem);
					} );
				}
                this.removeHolder(editor, index);
                editor.model.change(writer => {
                    if (index === 1) {
                        if (footNoteSection.childCount === 2) {
                            if (footNoteSection.previousSibling === null) {
                                const p = writer.createElement( 'paragraph' );
                                this.editor.model.insertContent( p, writer.createPositionAt( this.rootElement, 0 ));
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
        
		// @ts-ignore -- returning true here prevents future listeners from firing.
		// This matches the canonical use in the docs--the type signature is just wrong.
		schema.addChildCheck( ( context, childDefinition ) => {
            if (context.endsWith('footNoteList') && childDefinition.name === 'footNoteSection') {
				return false;
			}
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
				classes: ['footnote-section', 'footnotes'],
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
                classes: 'footnote-list',
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'footNoteList',
            view: {
                name: 'section',
                classes: 'footnote-list',
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNoteList',
            view: ( modelElement, conversionApi ) => {
                const viewWriter = conversionApi.writer;
                // Note: You use a more specialized createEditableElement() method here.
                const section = viewWriter.createEditableElement( 'section', { class: 'footnote-list' } );

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
            view: this.createItemView
        } );
        
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'footNoteItem',
            view: ( modelElement, conversionApi ) => {
                const viewWriter = conversionApi.writer;
				// @ts-ignore -- The type declaration for DowncastHelpers#elementToElement is incorrect. It expects
				// a view Element where it should expect a model Element.
                const section = this.createItemView( modelElement, conversionApi );
                return toWidget( section, viewWriter );
            }
        } );

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
            view: this.createPlaceholderView,
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'noteHolder',
            view: this.createPlaceholderView
        } );


        conversion.for( 'editingDowncast' )
        .add(dispatcher => {
            dispatcher.on( 'attribute:data-footnote-id:footNoteItem', this.modelViewChangeItem.bind(this), { priority: 'high' } );
            dispatcher.on( 'attribute:data-footnote-id:noteHolder', this.modelViewChangeHolder.bind(this), { priority: 'high' } );
        } );
	}
	
	_addAutoformatting() {
		if(this.editor.plugins.has('Autoformat')) {
			const autoformatPluginInstance = this.editor.plugins.get('Autoformat');
			inlineAutoformatEditing(this.editor, autoformatPluginInstance, 
				(text) => {
					const results = text.match(/\[\^([0-9]+)\]/);
					if(results && results.length === 2) {
						const removeStart = text.indexOf(results[0])
						const removeEnd = removeStart + results[0].length;
						const formatStart = removeStart + 2;
						const formatEnd = formatStart + results[1].length;
						return {
							remove: [[removeStart, removeEnd]],
							format: [[formatStart, formatEnd]],
						}
					}
					return {
						remove: [],
						format: [],
					}
				}
				, (writer, ranges) => {
				const command = this.editor.commands.get('InsertFootnote');
				if(!command || !command.isEnabled) {
					return;
				}
				// @ts-ignore 
				const textProxy = [...ranges[0].getItems()][0];
				const footnoteId = parseInt(textProxy.data.match(/[0-9]+/)[0]);
				// @ts-ignore
				const footNoteSection = this.queryDescendantFirst({rootElement: this.rootElement, predicate: (e) => e.name === 'footNoteSection'});
				if(!footNoteSection) {
					if(footnoteId !== 1) {
						return false;
					}
					this.editor.execute('InsertFootnote', { footnoteId: 0 });
					return;
				}
				const footnoteCount = this.queryDescendantsAll({rootElement: footNoteSection, predicate: (e) => e.name === 'footNoteItem'}).length;
				if(footnoteId === footnoteCount + 1) {
					this.editor.execute('InsertFootnote', { footnoteId: 0 });
					return;
				}
				else if(footnoteId >= 1 && footnoteId <= footnoteCount) {
					this.editor.execute('InsertFootnote', { footnoteId: footnoteId })
					return;
				}
				return false;
			});
		}
	}

	/**
	 * @param {Element} modelElement 
	 * @param {DowncastConversionApi} conversionApi 
	 * @returns {ContainerElement}
	 */
	createPlaceholderView( modelElement, conversionApi ) {
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

	/**
	 * 
	 * @param {Element} modelElement 
	 * @param {DowncastConversionApi} conversionApi 
	 * @returns {ContainerElement}
	 */
	createItemView( modelElement, conversionApi ) {
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
		const textNode = this.queryDescendantFirst({rootElement: itemView, type: 'text'});

		const viewWriter = conversionApi.writer;

		if(!textNode){
			viewWriter.remove(itemView);
			return;
		}

		const parent = textNode.parent; 
		viewWriter.remove(textNode);
		

		const innerText = viewWriter.createText( data.attributeNewValue + '. ' );
		viewWriter.insert( viewWriter.createPositionAt( parent, 0 ), innerText );

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
		const textNode = this.queryDescendantFirst({rootElement: noteHolderView, type: 'text'});

		if(!textNode){
			viewWriter.remove(noteHolderView);
			return
		}

		viewWriter.remove(textNode);
		const parent = textNode.parent;
		const innerText = viewWriter.createText( `[${data.attributeNewValue.toString()}]`);
		viewWriter.insert( viewWriter.createPositionAt( parent, 0 ), innerText );

	}

	/**
	 * 
	 * @param {Editor} editor 
	 * @param {number} index 
	 */
	removeHolder(editor, index) {
		const removeList = [];
		if(!this.rootElement) throw new Error('Document has no root element.');
		const range = editor.model.createRangeIn(this.rootElement);
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
