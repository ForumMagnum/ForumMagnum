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
    background: theme.palette.grey[60],
    padding: 4,
    paddingLeft: 8,
    marginBottom: 16,
  },
  presenceList: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    //create stacking context
    position: "relative",
    zIndex: theme.zIndexes.editorPresenceList,
    
    "& .ck-presence-list": {
      marginBottom: "0 !important",
      alignItems: "center !important",
    },
    '& .ck-user__name': {
      color: 'unset !important',
      fontFamily: theme.typography.commentStyle.fontFamily + '!important',
    },
    '& .ck-presence-list__counter': {
      fontSize: '1rem !important',
      marginBottom: "0 !important",
      display: "block !important", //doesn't hide when more than 1 user, helps in cases with many users present
      wordBreak: "normal !important"
    },
    '& .ck-presence-list__list': {
      flexWrap: "wrap"
    },
    '& .ck-presence-list__list-item:nth-child(n+4)': {
      display:"none"
    },
    [theme.breakpoints.down('xs')]: {
      '& .ck-presence-list__list-item:nth-child(n+3)': {
        display:"none"
      }
    },
    "& .ck-tooltip": {
      transform: "initial !important",
      bottom: "initial !important",
      visibility: "visible !important",
      opacity: "initial !important",
      left: "0 !important",
      position: "relative !important",
    },
    "& .ck-user": {
      display: "none !important",
    },
    "& .ck-presence-list__marker": {
      display: "none !important",
    },
    "& .ck-tooltip__text": {
      background: "initial !important",
      color: `${theme.palette.text.normal} !important`,
      left: "0 !important",
      fontSize: '1rem !important'
    },
    "& .ck-tooltip__text::after": {
      display: "none !important",
    },
  },
  collabModeSelect: {
  },
  saveStatus: {
    '&:hover': {
      background: "unset"
    },
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
  tooltipWrapped: {
    marginRight: 16
  }
});

export type CollaborationMode = "Viewing"|"Commenting"|"Editing";

const EditorTopBar = ({presenceListRef, accessLevel, collaborationMode, setCollaborationMode, classes}: {
  presenceListRef: any,
  accessLevel: CollaborativeEditingAccessLevel,
  collaborationMode: CollaborationMode,
  setCollaborationMode: (mode: CollaborationMode)=>void,
  classes: ClassesType
}) => {
  const { LWTooltip } = Components

  return <div className={classes.editorTopBar}>
    <div className={classes.presenceList} ref={presenceListRef}/>
    <span>
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
          {/* TODO: Figure out how to wrap tooltip properly around MenuItem without breaking select */}
          <LWTooltip placement="right" title="To suggest changes, you must be in edit mode">
            <div className={classes.tooltipWrapped}>Commenting</div>
          </LWTooltip>
        </MenuItem>
        <MenuItem value="Editing" key="Editing"
          disabled={!accessLevelCan(accessLevel, "edit")}
        >
          Editing
        </MenuItem>
      </Select>
      <LWTooltip title="Collaborative docs automatically save all changes">
        <Button className={classes.saveStatus}>
          Auto-Saved
          {/*TODO: Make this track offline status etc*/}
        </Button>
      </LWTooltip>
    </span>
  </div>
}

const EditorTopBarComponent = registerComponent("EditorTopBar", EditorTopBar, {styles});

declare global {
  interface ComponentTypes {
    EditorTopBar: typeof EditorTopBarComponent
  }
}
