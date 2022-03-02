import React, {useCallback, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useMessages } from '../common/withMessages';
import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import { userCanUseSharing } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { SharingSettings, defaultSharingSettings } from '../../lib/collections/posts/collabEditingPermissions';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import PropTypes from 'prop-types';

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
    display: "flex",
  },
  spacer: {
    flexGrow: 1,
  },
  linkSharingDescriptionPart: {
    display: "block",
  },
});

const PostSharingSettings = ({document, formType, value, path, label, classes}: {
  formType: "edit"|"new",
  document: PostsEditQueryFragment,
  value: SharingSettings,
  path: string,
  label: string,
  classes: ClassesType
}, context) => {
  const {updateCurrentValues, submitForm} = context;
  const {openDialog, closeDialog} = useDialog();
  const currentUser = useCurrentUser();
  const hasUnsavedPermissionsChanges = false;
  const initialSharingSettings = value || defaultSharingSettings;
  const { flash } = useMessages();
  
  const onClickShare = useCallback(() => {
    if (!document.title || !document.title.length) {
      flash("Please give this post a title before sharing.");
      return;
    }
    
    // HACK: Check whether we're using CkEditor or something else. See wrappedSetCOntents
    // in EditorFormComponent.
    if ((document as any).contents_type && (document as any).contents_type !== "ckEditorMarkup") {
      flash("Change the editor type to LessWrong Docs to enable sharing");
      return;
    }
    
    openDialog({
      componentName: "PostSharingSettingsDialog",
      componentProps: {
        postId: document._id,
        initialSharingSettings,
        onConfirm: async (newSharingSettings: SharingSettings, newSharedUsers: string[], isChanged: boolean) => {
          if (isChanged || formType==="new") {
            await updateCurrentValues({
              sharingSettings: newSharingSettings,
              shareWithUsers: newSharedUsers
            });
            
            // If this is an unbacked post (ie a new-post form,
            // no corresponding document ID yet), we're going to
            // mark it as a draft, then submit the form.
            if (formType==="new") {
              await updateCurrentValues({ draft: true });
              await submitForm(null, {redirectToEditor: true});
            } else {
              // Otherwise we're going to leave whether-this-is-a-draft
              // unchanged, and subimt the form.
              await submitForm(null, {redirectToEditor: true});
            }
          }
          closeDialog();
        },
        initialShareWithUsers: document.shareWithUsers || [],
      },
      noClickawayCancel: true,
    });
  }, [openDialog, closeDialog, formType, document, updateCurrentValues, initialSharingSettings, flash, submitForm]);
  
  if (!userCanUseSharing(currentUser))
    return null;
  
  return <div className={classes.shareButtonSection}>
    <Button variant="contained" color="primary" onClick={onClickShare}>
      <div>
        Share<br/>
        <span className={classes.betaLabel}>(Beta)</span>
      </div>
    </Button>
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
      
      <div className={classes.buttonRow}>
        {sharingSettings && sharingSettings.anyoneWithLinkCan!=="none" &&
          <CopyToClipboard
            text={collabEditorLink}
            onCopy={(text,result) => {
              flash("Link copied");
            }}
          >
            <Button>Copy link</Button>
          </CopyToClipboard>
        }
        
        <span className={classes.spacer}/>
        
        <Button
          onClick={()=>onClose()}
        >
          Cancel
        </Button>
        <Button variant="contained" color="primary"
          onClick={() => onConfirm(sharingSettings, shareWithUsers, isChanged)}
        >
          Confirm
        </Button>
      </div>
    </div>
  </LWDialog>
}

const PostSharingSettingsComponent = registerComponent('PostSharingSettings', PostSharingSettings, {styles});
const PostSharingSettingsDialogComponent = registerComponent('PostSharingSettingsDialog', PostSharingSettingsDialog, {styles});

declare global {
  interface ComponentTypes {
    PostSharingSettings: typeof PostSharingSettingsComponent,
    PostSharingSettingsDialog: typeof PostSharingSettingsDialogComponent
  }
}
