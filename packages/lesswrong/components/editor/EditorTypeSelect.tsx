import React from 'react'
import { EditorContents, EditorTypeString, EditorChangeEvent, nonAdminEditors, adminEditors, getEditorTypeToDisplayMap } from './Editor';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import { useConvertDocument } from './useConvertDocument';
import Loading from "../vulcan-core/Loading";
import { MenuItem } from "../common/Menus";

const styles = (theme: ThemeType) => ({
  select: {
  },
});

const EditorTypeSelect = ({value, setValue, isCollaborative, classes}: {
  value: EditorContents,
  setValue: (change: EditorChangeEvent) => void,
  isCollaborative?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {convertDocument, loading, error} = useConvertDocument({
    onCompleted: (result: EditorContents) => {
      setValue({
        contents: result,
        autosave: false,
      });
    }
  });
  
  if (!currentUser?.markDownPostEditor && !currentUser?.isAdmin) return null
  const editors = currentUser?.isAdmin ? adminEditors : nonAdminEditors
  
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

export default registerComponent("EditorTypeSelect", EditorTypeSelect, {styles});


