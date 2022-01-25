import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';

const styles = (theme: ThemeType): JssStyles => ({
  editorTopBar: {
    display: "flex",
    width: "100%",
    background: "#f8f8f8",
    padding: 4,
    paddingLeft: 8,
    marginBottom: 16,
  },
  presenceList: {
    flexGrow: 1,
    
    "& .ck-presence-list": {
      marginBottom: "0 !important",
    },
    
    '& .ck-user': { //.CKPostEditor-presenceList .ck-user__name
      backgroundColor: 'unset !important',
      borderRadius: '0% !important'
    },
    '& .ck-user__name': { //.CKPostEditor-presenceList .ck-user__name
      color: 'unset !important',
      fontFamily: theme.typography.commentStyle.fontFamily + '!important',
      fontSize: '1.2rem'
    }
  }
  collabModeSelect: {
  },
  saveStatus: {
  },
});

export type CollaborationMode = "Viewing"|"Commenting"|"Editing";

const EditorTopBar = ({presenceListRef, collaborationMode, setCollaborationMode, classes}: {
  presenceListRef: any,
  collaborationMode: CollaborationMode,
  setCollaborationMode: (mode: CollaborationMode)=>void,
  classes: ClassesType
}) => {
  const availableModes = ["Viewing","Commenting","Editing"]; //TODO: Filter by permissions
  
  return <div className={classes.editorTopBar}>
    <div className={classes.presenceList} ref={presenceListRef}/>
    
    <Select
      className={classes.collabModeSelect} disableUnderline
      value={collaborationMode}
      onChange={(e) => {
        const newMode = e.target.value as CollaborationMode;
        setCollaborationMode(newMode);
      }}
    >
      {availableModes.map((mode, i) =>
        <MenuItem value={mode} key={i}>
          {mode}
        </MenuItem>
      )}
    </Select>
    
    <Button className={classes.saveStatus}>
      Saved
      {/*TODO: Make this track offline status etc*/}
    </Button>
  </div>
}

const EditorTopBarComponent = registerComponent("EditorTopBar", EditorTopBar, {styles});

declare global {
  interface ComponentTypes {
    EditorTopBar: typeof EditorTopBarComponent
  }
}
