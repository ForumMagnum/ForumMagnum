import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { CollaborativeEditingAccessLevel, accessLevelCan } from '../../lib/collections/posts/collabEditingPermissions';
import {useCurrentUser} from '../common/withUser';
import { isFriendlyUI } from '../../themes/forumTheme';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import type { ConnectedUserInfo } from './CKPostEditor';

const styles = (theme: ThemeType) => ({
  editorTopBar: {
    display: "flex",
    width: "100%",
    background: theme.palette.grey[60],
    padding: 4,
    paddingLeft: 16,
    marginBottom: 16,
  },
  presenceList: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    //create stacking context
    position: "relative",
    zIndex: theme.zIndexes.editorPresenceList,
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

export type CollaborationMode = "Viewing"|"Commenting"|"Editing"|"Editing (override)";

const EditorTopBar = ({accessLevel, collaborationMode, setCollaborationMode, post, connectedUsers, classes}: {
  accessLevel: CollaborativeEditingAccessLevel,
  collaborationMode: CollaborationMode,
  setCollaborationMode: (mode: CollaborationMode) => void,
  post: PostsEdit,
  connectedUsers: ConnectedUserInfo[],
  classes: ClassesType<typeof styles>,
}) => {
  const { PresenceList, LWTooltip, MenuItem } = Components
  const currentUser = useCurrentUser();
  
  const isAdmin = !!currentUser && currentUser.isAdmin;
  const canComment = accessLevelCan(accessLevel, "comment") || isAdmin;
  const canEdit = accessLevelCan(accessLevel, "edit") || isAdmin;
  
  const canCommentOnlyBecauseAdmin = isAdmin && !accessLevelCan(accessLevel, "comment");
  const canEditOnlyBecauseAdmin = isAdmin && !accessLevelCan(accessLevel, "edit");
  const alwaysShownUserIds = [post.userId, ...(post.coauthorStatuses?.map(u=>u.userId) ?? [])]

  if (isFriendlyUI && post.collabEditorDialogue) {
    return null;
  }

  return <div className={classes.editorTopBar}>
    <div className={classes.presenceList}>
      <PresenceList connectedUsers={connectedUsers} alwaysShownUserIds={alwaysShownUserIds}/>
    </div>
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
        {post.collabEditorDialogue && <MenuItem value="Editing (override)" key="Editing (override)"
          disabled={!canEdit}
        >
          Editing (override)
          {canEditOnlyBecauseAdmin && " (admin override)"}
        </MenuItem>}
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
