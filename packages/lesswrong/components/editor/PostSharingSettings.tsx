import React, {FC, useCallback, useState} from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useMessages } from '../common/withMessages';
import { userCanUseSharing } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { SharingSettings, defaultSharingSettings } from '../../lib/collections/posts/collabEditingPermissions';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import PersonAddIcon from '@/lib/vendor/@material-ui/icons/src/PersonAdd';
import { moderationEmail } from '../../lib/publicSettings';
import { EditablePost, getPostCollaborateUrl, PostSubmitMeta } from '../../lib/collections/posts/helpers';
import { ckEditorName } from './Editor';
import { isFriendlyUI } from '../../themes/forumTheme';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('PostSharingSettings', (theme: ThemeType) => ({
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
  friendlyButton: {
      color: theme.palette.grey[900],
      backgroundColor: "transparent",
      padding: "2px 12px",
      '&:hover': {
        backgroundColor: theme.palette.grey[200],
      },
      '&:disabled': {
        color: theme.palette.grey[900],
        backgroundColor: "transparent",
        opacity: 0.5
      },
  },
  buttonInternalIcon: {
    width: "20px",
    marginRight: 6
  },
  disabledIcon: {
    opacity: .35,
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
}));

const PostSharingIcon: FC<{
  className?: string,
  onClick?: () => void,
}> = (props) => {
  const {ForumIcon} = Components;
  return isFriendlyUI
    ? (
      <ForumIcon icon="Share" {...props} />
    )
    : (
      <PersonAddIcon {...props} />
    );
}

const shareTooltip = isFriendlyUI
  ? "Share this post"
  : "Share this document";

const noSharePermissionTooltip = isFriendlyUI
  ? "You need at least 1 karma or to be approved by a moderator to share this post"
  : "You need at least 1 karma or to be approved by a mod to share";

interface PostSharingSettingsProps {
  field: TypedFieldApi<SharingSettings, EditablePost, PostSubmitMeta>;
  post: EditablePost;
  formType: "new" | "edit";
}

export const PostSharingSettings = ({ field, post, formType }: PostSharingSettingsProps) => {
  const classes = useStyles(styles);

  const value = field.state.value;

  const {openDialog, closeDialog} = useDialog();
  const currentUser = useCurrentUser();
  const initialSharingSettings = value || defaultSharingSettings;
  const { flash } = useMessages();
  
  const onClickShare = useCallback(() => {
    if (!post.title || !post.title.length) {
      flash("Please give this post a title before sharing.");
      return;
    }
    
    // Check whether we're using CkEditor, or something else.
    // HACK: This isn't stored in a reliable place, until you edit.
    // EditorFormComponent puts it in contents_type for us on edit, but if the
    // contents haven't been edited yet it's not there. So we check
    // originalContents.type, which, if it's an edit form (as opposed to a new
    // form) will have the contents as they were on load. If it's not there
    // either, it's a new, not-yet-edited post, and we have a separate error
    // message for that.
    // See also EditorFormComponent.
    const editorType = (post as any).contents_type || post.contents?.originalContents?.type;
    if (!editorType) {
      flash("Edit the document first to enable sharing");
      return;
    } else if(editorType !== "ckEditorMarkup") {
      flash(`Change the editor type to ${ckEditorName} to enable sharing`);
      return;
    }
    
    openDialog({
      name: "PostSharingSettingsDialog",
      contents: ({onClose}) => <PostSharingSettingsDialog
        onClose={onClose}
        post={post}
        linkSharingKey={post.linkSharingKey ?? undefined}
        initialSharingSettings={initialSharingSettings}
        onConfirm={async (newSharingSettings: SharingSettings, newSharedUsers: string[], isChanged: boolean) => {
          if (isChanged || formType==="new") {
            field.handleChange(newSharingSettings);
            field.form.setFieldValue('shareWithUsers', newSharedUsers);
            
            // If this is an unbacked post (ie a new-post form,
            // no corresponding document ID yet), we're going to
            // mark it as a draft, then submit the form.
            if (formType==="new") {
              field.form.setFieldValue('draft', true);
            }
            // Otherwise we're going to leave whether-this-is-a-draft
            // unchanged, and subimt the form.
            await field.form.handleSubmit({ redirectToEditor: true })
          }
          closeDialog();
        }}
        initialShareWithUsers={post.shareWithUsers || []}
      />
    });
  }, [openDialog, closeDialog, formType, post, field, initialSharingSettings, flash]);

  const {LWTooltip, EAButton} = Components;

  const canUseSharing = userCanUseSharing(currentUser)

  return <LWTooltip title={canUseSharing ? undefined : noSharePermissionTooltip}>
      <EAButton
        className={classes.friendlyButton}
        onClick={userCanUseSharing(currentUser) ? onClickShare : undefined}
        disabled={!canUseSharing}
      >
        <PostSharingIcon className={classes.buttonInternalIcon} />
        Share {post.draft ? " this draft" : ""}
      </EAButton>
    </LWTooltip>
}

const PostSharingSettingsDialog = ({post, linkSharingKey, initialSharingSettings, initialShareWithUsers, onClose, onConfirm}: {
  // postId: string,
  post: EditablePost,
  // linkSharingKey is only marked nullable for security-mindset reasons; in practice it's filled in by a callback and shouldn't be missing
  linkSharingKey?: string,
  initialSharingSettings: SharingSettings,
  initialShareWithUsers: string[],
  onClose: () => void,
  onConfirm: (newSharingSettings: SharingSettings, newSharedUsers: string[], isChanged: boolean) => void
}) => {
  const { EditableUsersList, LWDialog, LWTooltip, MenuItem } = Components;

  const classes = useStyles(styles);
  const [sharingSettings, setSharingSettingsState] = useState({...initialSharingSettings});
  const [shareWithUsers, setShareWithUsersState] = useState(initialShareWithUsers);
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
  
  const collabEditorLink = getPostCollaborateUrl(post._id, true, linkSharingKey)
  
  const commentingTooltip = "(suggest changes requires edit permission)"

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
          <MenuItem value="none" disabled={!!post.collabEditorDialogue}>None</MenuItem>
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

      <div className={classes.buttonRow}>
        {(sharingSettings.anyoneWithLinkCan!=="none" && post._id)
          ? <CopyToClipboard
              text={collabEditorLink}
              onCopy={(_text, _result) => {
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
