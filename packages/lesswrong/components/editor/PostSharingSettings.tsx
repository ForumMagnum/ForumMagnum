import React, {useCallback, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useMessages } from '../common/withMessages';
import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import PropTypes from 'prop-types';

export type CollaborativeEditingAccessLevel = "none"|"read"|"comment"|"edit";

interface SharingSettings {
  anyoneWithLinkCan: CollaborativeEditingAccessLevel,
  explicitlySharedUsersCan: CollaborativeEditingAccessLevel,
}
const defaultSharingSettings: SharingSettings = {
  anyoneWithLinkCan: "none",
  explicitlySharedUsersCan: "none",
};

export function strongerAccessLevel(a: CollaborativeEditingAccessLevel|null, b: CollaborativeEditingAccessLevel|null): CollaborativeEditingAccessLevel {
  if (a==="edit" || b==="edit") return "edit";
  if (a==="comment" || b==="comment") return "comment";
  if (a==="read" || b==="read") return "read";
  if (a) return a;
  if (b) return b;
  return "none";
}

const styles = (theme: ThemeType): JssStyles => ({
  linkSharingPreview: {
    fontFamily: theme.typography.fontFamily,
  },
  sharingSettingsDialog: {
    width: 500,
    padding: 16,
    fontFamily: theme.typography.fontFamily,
    color: "rgba(0,0,0,.87)",
  },
  sharingPermissionsRow: {
  },
  sharingPermissionsLabel: {
    display: "inline-block",
    minWidth: 150,
  },
  sharingPermissionsDropdown: {
    minWidth: 100,
  },
  buttonRow: {
    marginTop: 16,
    marginLeft: "auto",
  },
  linkSharingDescriptionPart: {
    display: "block",
  },
});

const PostSharingSettings = ({document, formType, value, path, label, classes}: {
  formType: "edit"|"new",
  document: PostsEdit,
  value: SharingSettings,
  path: string,
  label: string,
  classes: ClassesType
}, context) => {
  const {updateCurrentValues, submitForm} = context;
  const {openDialog} = useDialog();
  //const [hasUnsavedPermissionsChanges, setHasUnsavedPermissionsChanges] = useState(false);
  const hasUnsavedPermissionsChanges = false;
  const initialSharingSettings = value || defaultSharingSettings;
  const { flash } = useMessages();
  
  const onClickShare = useCallback(() => {
    if (!document.title || !document.title.length) {
      flash("Please give this post a title before sharing.");
      return;
    }
    
    openDialog({
      componentName: "PostSharingSettingsDialog",
      componentProps: {
        postId: document._id,
        initialSharingSettings,
        onConfirm: (newSharingSettings: SharingSettings, newSharedUsers: string[], isChanged: boolean) => {
          if (isChanged) {
            console.log("Confirmed changes to sharing settings. Updating form.");
            console.log(newSharingSettings);
            console.log(newSharedUsers);
            updateCurrentValues({
              sharingSettings: newSharingSettings,
              shareWithUsers: newSharedUsers
            });
            //setHasUnsavedPermissionsChanges(true);
            
            // If this is an unbacked post (ie a new-post form,
            // no corresponding document ID yet), we're going to
            // mark it as a draft, then submit the form.
            if (formType==="new") {
              console.log("Shared an unbacked draft. Saving.");
              updateCurrentValues({ draft: true });
              submitForm();
            } else {
              // Otherwise we're going to leave whether-this-is-a-draft
              // unchanged, and subimt the form.
              console.log("Shared an existing post. Saving.");
              submitForm();
            }
          }
        },
        initialShareWithUsers: document.shareWithUsers || [],
      },
      noClickawayCancel: true,
    });
  }, [openDialog, formType, document, updateCurrentValues, initialSharingSettings]);
  
  return <div className={classes.shareButtonSection}>
    <Button color="primary" onClick={onClickShare}>
      Share
    </Button>
    <div onClick={onClickShare}>
      <PreviewSharingSettings sharingSettings={value} unsavedChanges={hasUnsavedPermissionsChanges} classes={classes}/>
    </div>
  </div>
}

(PostSharingSettings as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  submitForm: PropTypes.func,
};

const PreviewSharingSettings = ({sharingSettings, unsavedChanges, classes}: {
  sharingSettings: SharingSettings,
  unsavedChanges: boolean,
  classes: ClassesType,
}) => {
  if (!sharingSettings)
    return <div/>;
  
  return <span className={classes.linkSharingPreview}>
    {sharingSettings.anyoneWithLinkCan === "read"    && <span className={classes.linkSharingDescriptionPart}>Anyone with the link can read</span>}
    {sharingSettings.anyoneWithLinkCan === "comment" && <span className={classes.linkSharingDescriptionPart}>Anyone with the link can comment</span>}
    {sharingSettings.anyoneWithLinkCan === "edit"    && <span className={classes.linkSharingDescriptionPart}>Anyone with the link can edit</span>}
    
    {sharingSettings.explicitlySharedUsersCan === "read"    && <span className={classes.linkSharingDescriptionPart}>Explicitly shared users can can read</span>}
    {sharingSettings.explicitlySharedUsersCan === "comment" && <span className={classes.linkSharingDescriptionPart}>Explicitly shared users can comment</span>}
    {sharingSettings.explicitlySharedUsersCan === "edit"    && <span className={classes.linkSharingDescriptionPart}>Explicitly shared users can edit</span>}
    
    {unsavedChanges && <span className={classes.saveAsDraftToApplyChanges}>Click Save as Draft to apply changes to permissions settings.</span>}
  </span>
  
  return <div/>
}


const PostSharingSaveFirstDialog = ({onClose, classes}: {
  onClose: ()=>void,
  classes: ClassesType
}) => {
  const { LWDialog } = Components;
  
  const onClickDone = useCallback(() => {
    // TODO: Trigger a form submission to save a backing draft
    onClose();
  }, [onClose]);
  
  return <LWDialog open={true} onClose={onClose}>
    <p>Please save this post as a draft before sharing it.</p>
    <Button onClick={onClickDone}>Ok</Button>
  </LWDialog>
}

const PostSharingSettingsDialog = ({postId, initialSharingSettings, initialShareWithUsers, onClose, onConfirm, classes}: {
  postId: string,
  initialSharingSettings: SharingSettings,
  setSharingSettings: (newSettings: SharingSettings)=>void,
  initialShareWithUsers: string[],
  setShareWithUsers: (newUsers: string[])=>void
  onClose: ()=>void,
  onConfirm: (newSharingSettings: SharingSettings, newSharedUsers: string[], isChanged: boolean)=>void
  classes: ClassesType
}) => {
  const { EditableUsersList, LWDialog } = Components;
  const [sharingSettings, setSharingSettingsState] = useState({...initialSharingSettings});
  const [shareWithUsers, setShareWithUsersState] = useState(initialShareWithUsers);
  const [isChanged, setIsChanged] = useState(false);
  const { flash } = useMessages();
  
  const updateSharingSettings = (newSettings: SharingSettings) => {
    setSharingSettingsState(newSettings);
    //setSharingSettings(newSettings);
    setIsChanged(true);
  };
  const updateSharedUsers = (newSharedUsers: string[]) => {
    setShareWithUsersState(newSharedUsers);
    //setShareWithUsers(newSharedUsers);
    setIsChanged(true);
  };
  
  const linkPrefix = getSiteUrl().slice(0,-1);
  const collabEditorLink = `${linkPrefix}/collaborateOnPost?postId=${postId}`
  
  return <LWDialog open={true}>
    <div className={classes.sharingSettingsDialog}>
      <h2>Sharing Settings</h2>
      
      <p>Shared With Users:</p>
      <EditableUsersList
        value={shareWithUsers}
        setValue={(newUsers: string[]) => {
          updateSharedUsers(newUsers);
        }}
        label="Shared with these users"
      />
      
      <div className={classes.sharingPermissionsRow}>
        <span className={classes.sharingPermissionsLabel}>Explicitly shared users can:</span>
        <Select
          className={classes.sharingPermissionsDropdown}
          value={sharingSettings.explicitlySharedUsersCan}
          onChange={(e) => {
            updateSharingSettings({...sharingSettings, explicitlySharedUsersCan: e.target.value as any});
          }}
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="read">Read</MenuItem>
          <MenuItem value="comment">Comment</MenuItem>
          <MenuItem value="edit">Edit</MenuItem>
        </Select>
      </div>
      
      <div className={classes.sharingPermissionsRow}>
        <span className={classes.sharingPermissionsLabel}>Anyone with the link can:</span>
        <Select
          className={classes.sharingPermissionsDropdown}
          value={sharingSettings.anyoneWithLinkCan}
          onChange={(e) => {
            updateSharingSettings({...sharingSettings, anyoneWithLinkCan: e.target.value as any});
          }}
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="read">Read</MenuItem>
          <MenuItem value="comment">Comment</MenuItem>
          <MenuItem value="edit">Edit</MenuItem>
        </Select>
      </div>
      
      {sharingSettings && sharingSettings.anyoneWithLinkCan!=="none" && <div>
        <CopyToClipboard
          text={collabEditorLink}
          onCopy={(text,result) => {
            flash("Link copied");
          }}
        >
          <Button>Copy link</Button>
        </CopyToClipboard>
      </div>}
      
      <div className={classes.buttonRow}>
        <Button color="primary"
          onClick={() => onConfirm(sharingSettings, shareWithUsers, isChanged)}
        >
          Confirm
        </Button>
        <Button
          onClick={()=>onClose()}
        >
          Cancel
        </Button>
      </div>
    </div>
  </LWDialog>
}

const PostSharingSettingsComponent = registerComponent('PostSharingSettings', PostSharingSettings, {styles});
const PostSharingSettingsDialogComponent = registerComponent('PostSharingSettingsDialog', PostSharingSettingsDialog, {styles});
const PostSharingSaveFirstDialogComponent = registerComponent('PostSharingSaveFirstDialog', PostSharingSaveFirstDialog, {styles});

declare global {
  interface ComponentTypes {
    PostSharingSettings: typeof PostSharingSettingsComponent,
    PostSharingSettingsDialog: typeof PostSharingSettingsDialogComponent
    PostSharingSaveFirstDialog: typeof PostSharingSaveFirstDialogComponent
  }
}
