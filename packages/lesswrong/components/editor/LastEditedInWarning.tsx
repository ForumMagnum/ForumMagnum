import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { editorTypeToDisplay, EditorTypeString, EditorContents, EditorChangeEvent } from './Editor';
import { useConvertDocument } from './useConvertDocument';

const styles = (theme: ThemeType) => ({
  lastEditedWarning: {
    color: theme.palette.error.main,
  },
  clickHereColor: {
    color: theme.palette.primary.main
  },
});

const LastEditedInWarning = ({initialType, currentType, defaultType, value, setValue, classes}: {
  initialType: EditorTypeString,
  currentType: EditorTypeString,
  defaultType: EditorTypeString,
  value: EditorContents,
  setValue: (change: EditorChangeEvent) => void,
  classes: ClassesType<typeof styles>
}) => {
  const { Loading, Typography } = Components;
  const {convertDocument, loading, error} = useConvertDocument({
    onCompleted: (result: EditorContents) => {
      setValue({
        contents: result,
        autosave: false,
      });
    }
  });
  
  return <div>
    {loading && <Loading/>}
    <Typography variant="body2" className={classes.lastEditedWarning}>
      This document was last saved in {editorTypeToDisplay[initialType].name} format. Showing the{' '}
      {editorTypeToDisplay[currentType].name} editor.{' '}
      <a
        className={classes.clickHereColor}
        onClick={() => {
          convertDocument(value, 'ckEditorMarkup');
        }}
      >
        Click here
      </a>
      {' '}to switch to the {editorTypeToDisplay['ckEditorMarkup'].name} editor (the default editor).
    </Typography>
    <br/>
  </div>
}

export const LastEditedInWarningComponent = registerComponent('LastEditedInWarning', LastEditedInWarning, {styles});

declare global {
  interface ComponentTypes {
    LastEditedInWarning: typeof LastEditedInWarningComponent
  }
}
