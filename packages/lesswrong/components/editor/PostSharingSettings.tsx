import React, {useCallback} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useMessages } from '../common/withMessages';
import { userCanUseSharing } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { SharingSettings, defaultSharingSettings } from '../../lib/collections/posts/collabEditingPermissions';
import PropTypes from 'prop-types';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { ckEditorName } from './Editor';

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

const PostSharingSettings = ({document, formType, value, path, label, classes}: {
  formType: "edit"|"new",
  document: PostsEditQueryFragment,
  value: SharingSettings,
  path: string,
  label: string,
  classes: ClassesType
}, context: any) => {
  const {updateCurrentValues, submitForm} = context;
  const { LWTooltip } = Components
  const {openDialog, closeDialog} = useDialog();
  const currentUser = useCurrentUser();
  const initialSharingSettings = value || defaultSharingSettings;
  const { flash } = useMessages();
  
  const onClickShare = useCallback(() => {
    if (!document.title || !document.title.length) {
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
    const editorType = (document as any).contents_type || (document as any).contents?.originalContents?.type;
    if (!editorType) {
      flash("Edit the document first to enable sharing");
      return;
    } else if(editorType !== "ckEditorMarkup") {
      flash(`Change the editor type to ${ckEditorName} to enable sharing`);
      return;
    }
    
    openDialog({
      componentName: "PostSharingSettingsDialog",
      componentProps: {
        postId: document._id,
        linkSharingKey: document.linkSharingKey ?? undefined,
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
  
  return <LWTooltip title="Share this document (Beta)">
    <PersonAddIcon className={classes.buttonIcon} onClick={onClickShare}/>
  </LWTooltip>
}

(PostSharingSettings as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  submitForm: PropTypes.func,
};


const PostSharingSettingsComponent = registerComponent('PostSharingSettings', PostSharingSettings, {styles});

declare global {
  interface ComponentTypes {
    PostSharingSettings: typeof PostSharingSettingsComponent,
  }
}
