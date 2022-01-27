import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { CollaborativeEditingAccessLevel, accessLevelCan } from '../../lib/collections/posts/collabEditingPermissions';
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
  },
  collabModeSelect: {
  },
  saveStatus: {
  },
});

export type CollaborationMode = "Viewing"|"Commenting"|"Editing";

const EditorTopBar = ({presenceListRef, accessLevel, collaborationMode, setCollaborationMode, classes}: {
  presenceListRef: any,
  accessLevel: CollaborativeEditingAccessLevel,
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
      <MenuItem value="Viewing" key="Viewing">
        Viewing
      </MenuItem>
      <MenuItem value="Commenting" key="Commenting"
        disabled={!accessLevelCan(accessLevel, "comment")}
      >
        Commenting
      </MenuItem>
      <MenuItem value="Editing" key="Editing"
        disabled={!accessLevelCan(accessLevel, "edit")}
      >
        Editing
      </MenuItem>
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
