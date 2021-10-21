import Command from '@ckeditor/ckeditor5-core/src/command';

export default class InsertFootNoteCommand extends Command {
    execute( { value } ) {
        const doc = this.editor.model.document;
        if (doc.getRoot().getChild(doc.getRoot().maxOffset - 1).name !== 'footNote') {
            this.editor.model.change( writer => {
                this.editor.model.insertContent( createFootNote( writer ), writer.createPositionAt( doc.getRoot(), doc.getRoot().maxOffset ));
            } );
        }
        else {
            if ( value !== 0 ) {
                this.editor.model.change( writer => {
                    const noteholder = writer.createElement( 'noteHolder', { id: value } );
                    this.editor.model.insertContent( noteholder );
                    writer.setSelection( noteholder, 'on' );
                } );
            }
            else {
                this.editor.model.change( writer => {
                    const footNote = doc.getRoot().getChild(doc.getRoot().maxOffset - 1);
                    const footNoteList = writer.createElement( 'footNoteList' );
                    const footNoteItem = writer.createElement( 'footNoteItem', { id: footNote.maxOffset } );
                    const p = writer.createElement( 'paragraph' );
                    writer.append( footNoteItem, p );
                    writer.append( p, footNoteList ) ;

                    this.editor.model.insertContent( footNoteList, writer.createPositionAt( footNote, footNote.maxOffset ));
                } );
            }            
        }
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent( selection.getLastPosition(), 'footNote' );
        this.isEnabled = allowedIn !== null;
    }
}

function createFootNote( writer ) {
    const footNote = writer.createElement( 'footNote' );
    const footNoteList = writer.createElement( 'footNoteList' );
    const footNoteItem = writer.createElement( 'footNoteItem', { id: 1 } );
    const p = writer.createElement( 'paragraph');

    writer.append( footNoteList, footNote );
    writer.append( footNoteItem, p ) ;
    writer.append( p, footNoteList );

    // There must be at least one paragraph for the description to be editable.
    // See https://github.com/ckeditor/ckeditor5/issues/1464.
    //writer.appendElement( 'paragraph', footNoteList );

    return footNote;
}
