import React, { RefObject, useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { CollaborativeEditingAccessLevel, accessLevelCan } from '../../lib/collections/posts/collabEditingPermissions';
import {useCurrentUser} from '../common/withUser';
import Select from '@material-ui/core/Select';
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
    
    // Workaround for duplicate presence list bug, see comment on useEffect below
    "& .ck-presence-list:nth-child(n+2)": {
      display: 'none'
    },

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
  presenceListRef: RefObject<HTMLDivElement>,
  accessLevel: CollaborativeEditingAccessLevel,
  collaborationMode: CollaborationMode,
  setCollaborationMode: (mode: CollaborationMode)=>void,
  classes: ClassesType
}) => {
  const { LWTooltip, MenuItem } = Components
  const currentUser = useCurrentUser();

  /**
   * This is a workaround for a bug resulting from the PresenceList and TrackChangesData plugins.
   * When getDataWithDiscardedSuggestions is called in Editor.tsx (called via throttledSetContentsValue)
   * it results in a new presence list being added with "0 connected users". I have no idea why this happens,
   * and both the plugins are closed source so it will be very hard to work out. This workaround removes all
   * but the first presence list, which is the one that actually contains the correct data. Any others that
   * are created temporarily are also hidden by the "& .ck-presence-list:nth-child(n+2)" selector above.
   */
  const presenceListChildren = presenceListRef.current?.querySelectorAll(".ck-presence-list");
  useEffect(() => {
    // remove all but the first presence list
    if (!presenceListChildren) return;

    const [_, ...otherChildren] = Array.from(presenceListChildren);
    for (let child of otherChildren) {
      child.remove();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenceListChildren?.length])
  
  const isAdmin = !!currentUser && currentUser.isAdmin;
  const canComment = accessLevelCan(accessLevel, "comment") || isAdmin;
  const canEdit = accessLevelCan(accessLevel, "edit") || isAdmin;
  
  const canCommentOnlyBecauseAdmin = isAdmin && !accessLevelCan(accessLevel, "comment");
  const canEditOnlyBecauseAdmin = isAdmin && !accessLevelCan(accessLevel, "edit");

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
          disabled={!canComment}
        >
          {/* TODO: Figure out how to wrap tooltip properly around MenuItem without breaking select */}
          <LWTooltip placement="right" title="To suggest changes, you must be in edit mode">
            <div className={classes.tooltipWrapped}>
              Commenting
              {canCommentOnlyBecauseAdmin && " (admin override)"}
            </div>
          </LWTooltip>
        </MenuItem>
        <MenuItem value="Editing" key="Editing"
          disabled={!canEdit}
        >
          Editing
          {canEditOnlyBecauseAdmin && " (admin override)"}
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
