import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMessages } from '../common/withMessages';
import { SharingSettings } from '../../lib/collections/posts/collabEditingPermissions';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { moderationEmail } from '../../lib/publicSettings';
import { getPostCollaborateUrl } from '../../lib/collections/posts/helpers';
import { Tab, Tabs } from '@material-ui/core';

const styles = (theme: ThemeType): JssStyles => ({
  linkSharingPreview: {
    fontFamily: theme.typography.fontFamily,
  },
  sharingSettingsDialog: {
    width: 500,
    padding: 16,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.normal,
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
  buttonIcon: {
    cursor: "pointer"
  },
  spacer: {
    flexGrow: 1,
  },
  linkSharingDescriptionPart: {
    display: "block",
  },
  warning: {
    color: theme.palette.error.main
  },
  tooltipWrapped: {
    marginRight: 16
  }
});

const PostSharingSettingsDialog = ({postId, linkSharingKey, initialSharingSettings, initialShareWithUsers, onClose, onConfirm, classes}: {
  postId: string,
  // linkSharingKey is only marked nullable for security-mindset reasons; in practice it's filled in by a callback and shouldn't be missing
  linkSharingKey?: string,
  initialSharingSettings: SharingSettings,
  initialShareWithUsers: string[],
  onClose: ()=>void,
  onConfirm: (newSharingSettings: SharingSettings, newSharedUsers: string[], isChanged: boolean)=>void
  classes: ClassesType
}) => {
  const { EditableUsersList, LWDialog, LWTooltip, MenuItem } = Components;
  const [sharingSettings, setSharingSettingsState] = useState({...initialSharingSettings});
  const [shareWithUsers, setShareWithUsersState] = useState(initialShareWithUsers);
  const [activeTab, setActiveTab] = useState('draft');
  const [isChanged, setIsChanged] = useState(false);
  const { flash } = useMessages();
  
  const updateSharingSettings = (newSettings: SharingSettings) => {
    setSharingSettingsState(newSettings);
    setIsChanged(true);
  };
  const updateSharedUsers = (newSharedUsers: string[]) => {
    setShareWithUsersState(newSharedUsers);
    setIsChanged(true);
  };
  
  const collabEditorLink = getPostCollaborateUrl(postId, true, linkSharingKey)
  
  const commentingTooltip = "(suggest changes requires edit permission)"

  return <LWDialog open={true}>
    <div className={classes.sharingSettingsDialog}>
      <h2>Sharing Settings</h2>

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
        <Tab label='When Draft' value="draft" />
        <Tab label='When Published' value="published" />
      </Tabs>

      {activeTab === 'draft' && <>
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
            {/* TODO: Figure out how to wrap a menu item in a tooltip without breaking the Select dropdown */}
            <MenuItem value="comment">
              <LWTooltip placement="right" title={commentingTooltip}>
                <div className={classes.tooltipWrapped}>Comment</div>
              </LWTooltip>
            </MenuItem>
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
            <MenuItem  value="read">Read</MenuItem>
            <MenuItem value="comment">
              <LWTooltip placement="right" title={commentingTooltip}>
                <div className={classes.tooltipWrapped}>Comment</div>
              </LWTooltip>
            </MenuItem>
            <MenuItem value="edit">Edit</MenuItem>
          </Select>
        </div>
        
        <p className={classes.warning}>
          Collaborative Editing features are in beta. Message us on Intercom or email us at{' '}
          {moderationEmail.get()} if you experience issues
        </p>
      </>}
      
      {activeTab === 'published' && <>
        <div className={classes.sharingPermissionsRow}>
          <span className={classes.sharingPermissionsLabel}>Who can read the published post?</span>
          <Select
            className={classes.sharingPermissionsDropdown}
            value={sharingSettings.restrictedPublication ? 'restricted' : 'everyone'}
            onChange={(e) => {
              updateSharingSettings({...sharingSettings, restrictedPublication: e.target.value === 'restricted'});
            }}
          >
            <MenuItem value="everyone">Everyone</MenuItem>
            <MenuItem value="restricted">Only certain users</MenuItem>
          </Select>
        </div>
      </>}

      <div className={classes.buttonRow}>
        {(sharingSettings.anyoneWithLinkCan!=="none" && postId)
          ? <CopyToClipboard
              text={collabEditorLink}
              onCopy={(text,result) => {
                flash("Link copied");
              }}
            >
              <Button>Copy link</Button>
            </CopyToClipboard>
          : <LWTooltip title="Enable link-sharing permission and confirm sharing settings first">
              <Button disabled={true}>Copy link</Button>
            </LWTooltip>
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

const PostSharingSettingsDialogComponent = registerComponent('PostSharingSettingsDialog', PostSharingSettingsDialog, {styles});

declare global {
  interface ComponentTypes {
    PostSharingSettingsDialog: typeof PostSharingSettingsDialogComponent
  }
}
