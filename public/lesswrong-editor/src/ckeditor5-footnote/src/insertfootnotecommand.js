// TODO: Credit author
import Command from '@ckeditor/ckeditor5-core/src/command';

export default class InsertFootNoteCommand extends Command {
    // Value is the footnote number (1 indexed)
    execute( { value } ) {
        this.editor.model.change( writer => {
			const doc = this.editor.model.document;
            if (doc.getRoot().getChild(doc.getRoot().maxOffset - 1).name !== 'footNoteSection') {
                const footNoteSection = writer.createElement( 'footNoteSection' );
                this.editor.model.insertContent( footNoteSection, writer.createPositionAt( doc.getRoot(), doc.getRoot().maxOffset ));
            }
			const footNoteSection = doc.getRoot().getChild(doc.getRoot().maxOffset - 1);
			const id = value === 0 ? footNoteSection.maxOffset + 1 : value;
			doc.selection.isBackward ?
				writer.setSelection(doc.selection.anchor) : 
				writer.setSelection(doc.selection.focus);
            const noteholder = writer.createElement( 'noteHolder', { id } );
            this.editor.model.insertContent( noteholder );

            // if referencing an existing footnote
            if ( value !== 0 ) {
                writer.setSelection( noteholder, 'after' );
				return;
			}
			
			const footNoteList = writer.createElement( 'footNoteList' );
			const footNoteItem = writer.createElement( 'footNoteItem', { id: footNoteSection.maxOffset + 1 } );
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
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent( selection.getLastPosition(), 'footNoteSection' );
        this.isEnabled = allowedIn !== null;
    }
}
