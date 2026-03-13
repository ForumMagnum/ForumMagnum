import React from 'react'
import { EditorContents, EditorTypeString, EditorChangeEvent, getEditorsForUser, getEditorTypeToDisplayMap } from './Editor';
import { useCurrentUser } from '../common/withUser';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import { useConvertDocument } from './useConvertDocument';
import Loading from "../vulcan-core/Loading";
import { MenuItem } from "../common/Menus";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("EditorTypeSelect", (theme: ThemeType) => ({
  select: {
  },
}));

const EditorTypeSelect = ({value, setValue, isCollaborative}: {
  value: EditorContents,
  setValue: (change: EditorChangeEvent) => void,
  isCollaborative?: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const {convertDocument, loading, error} = useConvertDocument({
    onCompleted: (result: EditorContents) => {
      setValue({
        contents: result,
        autosave: false,
      });
    }
  });
  
  if (!currentUser?.markDownPostEditor && !currentUser?.isAdmin && !currentUser?.beta) return null
  const editors = getEditorsForUser(currentUser)
  
  return <>
    {loading && <Loading/>}
    <Select
      className={classes.select} disableUnderline
      value={value.type}
      onChange={(e) => {
        const targetFormat = e.target.value as EditorTypeString;
        
        if (isCollaborative && targetFormat !== "ckEditorMarkup") {
          if (!window.confirm("Switching to a different editor type will disable collaborative editing and reset the sharing settings on this post to private.")) {
            return;
          }
        }
        
        convertDocument(value, targetFormat);
      }}
    >
      {editors.map((editorType, i) =>
        <MenuItem value={editorType} key={i}>
          {getEditorTypeToDisplayMap()[editorType].name} {getEditorTypeToDisplayMap()[editorType].postfix}
        </MenuItem>
      )}
    </Select>
  </>
}

export default EditorTypeSelect;


