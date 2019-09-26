import React from 'react'
import CKEditor from '@ckeditor/ckeditor5-react';
import { CommentEditor } from '@lesswrong/lesswrong-editor';
import { withStyles } from '@material-ui/core/styles';
// Uncomment the import and the line below to activate the debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const styles = theme => ({
  root: {
    '--ck-focus-ring': 'unset'
  }
})

const CKCommentEditor = ({ classes, data, onSave, onInit }) => {
  return <div className={classes.root}>
    <CKEditor
      editor={ CommentEditor }
      data={data}
      onInit={ editor => {
          // Uncomment the line below and the import above to activate the debugger
          // CKEditorInspector.attach(editor)
          onInit(editor)
      } }
      config={{
        autosave: {
          save (editor) {
            return onSave && onSave( editor.getData() )
          }
        },
      }}
    />
  </div>
}
export default withStyles(styles)(CKCommentEditor)
