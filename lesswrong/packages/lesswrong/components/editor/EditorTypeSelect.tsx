import React from 'react'
import { EditorContents, EditorTypeString, EditorChangeEvent, nonAdminEditors, adminEditors, editorTypeToDisplay } from './Editor';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import Select from '@material-ui/core/Select';
import { useConvertDocument } from './useConvertDocument';
import { Loading } from "@/components/vulcan-core/Loading";
import { MenuItem } from "@/components/common/Menus";

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
          {editorTypeToDisplay[editorType].name} {editorTypeToDisplay[editorType].postfix}
        </MenuItem>
      )}
    </Select>
  </>
}

const EditorTypeSelectComponent = registerComponent("EditorTypeSelect", EditorTypeSelect, {styles});

declare global {
  interface ComponentTypes {
    EditorTypeSelect: typeof EditorTypeSelectComponent
  }
}

export default EditorTypeSelectComponent;
