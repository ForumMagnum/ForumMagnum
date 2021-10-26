// @ts-check
// TODO: Credit author
import Command from '@ckeditor/ckeditor5-core/src/command';
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import Writer from '@ckeditor/ckeditor5-engine/src/model/writer';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';
import { QueryMixin } from './utils';

export default class InsertFootNoteCommand extends QueryMixin(Command) {
	/**
	 *
	 * @param {{footnoteId: number}} props - A footnoteId of 0 indicates creation of a new footnote.
	 */
    execute( { footnoteId } ) {
        this.editor.model.change(writer => {
			const doc = this.editor.model.document;
			const root = doc.getRoot();
			if (!root) {
				return;
			}
            const footNoteSection = this._getFootNoteSection(writer, root);
			const id = footnoteId === 0 ? footNoteSection.maxOffset + 1 : footnoteId;
			doc.selection.isBackward ?
				writer.setSelection(doc.selection.anchor) : 
				writer.setSelection(doc.selection.focus);
            const noteholder = writer.createElement( 'noteHolder', { 'data-footnote-id': id } );
            this.editor.model.insertContent( noteholder );

            // if referencing an existing footnote
            if ( footnoteId !== 0 ) {
                writer.setSelection( noteholder, 'after' );
				return;
			}
			
			const footNoteList = writer.createElement( 'footNoteList' );
			const footNoteItem = writer.createElement(
				'footNoteItem',
				//fn{id} is the format used by our existing markdown footnotes
				{ 'data-footnote-id': id, id: `fn${id}` },
			);
			const p = writer.createElement( 'paragraph' );
			writer.append( footNoteItem, p );
			writer.append( p, footNoteList ) ;

			// There must be at least one paragraph for the description to be editable.
			// See https://github.com/ckeditor/ckeditor5/issues/1464.
			//writer.appendElement( 'paragraph', footNoteList );

			this.editor.model.insertContent( footNoteList, writer.createPositionAt( footNoteSection, footNoteSection.maxOffset ));
			writer.setSelection( p, 'end' );
        });
    }

    refresh() {
        const model = this.editor.model;
        const lastPosition = model.document.selection.getLastPosition();
        const allowedIn = lastPosition && model.schema.findAllowedParent(lastPosition, 'footNoteSection' );
        this.isEnabled = allowedIn !== null;
    }

	/**
	 * @param {Writer} writer 
	 * @param {RootElement} root 
	 * @returns 
	 */
	_getFootNoteSection(writer, root) {
		const lastChild = root.getChild(root.maxOffset - 1);

		if(lastChild && lastChild instanceof ModelElement && lastChild.name === 'footNoteSection') {
			return lastChild;
		}
		const footNoteSection = this.queryDescendantFirst({root, predicate: (/** @type {ModelElement}*/ element) =>  element.name === 'footNoteSection'});
		if(footNoteSection && footNoteSection.startOffset !== root.maxOffset - 1) {
			writer.move(this.editor.model.createRangeOn(footNoteSection), root, 'end');
			return footNoteSection;
		}
		const newFootNoteSection = writer.createElement( 'footNoteSection' );
		this.editor.model.insertContent( newFootNoteSection, writer.createPositionAt( root, root.maxOffset ));
		return newFootNoteSection;
	}
}
