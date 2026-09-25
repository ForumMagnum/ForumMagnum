import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import LWDialog from "../common/LWDialog";
import { DialogTitle } from "../widgets/DialogTitle";
import { DialogContent } from "../widgets/DialogContent";
import { DialogActions } from "../widgets/DialogActions";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { MuiTextField } from "../form-components/MuiTextField";
import { FormUserSelect } from "../form-components/UserSelect";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import { useImageUpload } from "../hooks/useImageUpload";
import { useCurrentUser } from "../common/withUser";
import { useNavigate } from "@/lib/routeUtil";
import { userIsAdmin, userIsAdminOrMod, userIsMemberOf } from "@/lib/vulcan-users/permissions";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSequenceEditor } from "./SequenceEditorContext";

const styles = defineStyles("SequenceSettingsDialog", (theme: ThemeType) => ({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: theme.palette.greyAlpha(0.55),
    marginBottom: 8,
  },
  cardImageRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  field: {
    marginBottom: 8,
  },
  deleteRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    ...theme.typography.commentStyle,
    fontSize: 14,
  },
  deleteButton: {
    color: theme.palette.error.main,
  },
}));

const SequenceSettingsDialog = ({ onClose }: { onClose: () => void }) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { sequence, updateSequence, saveSequenceNow } = useSequenceEditor();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const form = useForm({
    defaultValues: {
      hideFromAuthorPage: sequence.hideFromAuthorPage,
      af: sequence.af,
      userId: sequence.userId,
      curatedOrder: sequence.curatedOrder,
      userProfileOrder: sequence.userProfileOrder,
      canonicalCollectionSlug: sequence.canonicalCollectionSlug,
      hidden: sequence.hidden,
      noindex: sequence.noindex,
    },
  });

  const { uploadImage: uploadCardImage } = useImageUpload({
    imageType: "gridImageId",
    onUploadSuccess: (gridImageId: string) => updateSequence({ gridImageId }),
    onUploadError: (error: Error) => {
      // eslint-disable-next-line no-console
      console.error("Card image upload failed:", error);
    },
  });

  const deleteSequence = async () => {
    if (!await saveSequenceNow({ isDeleted: true })) {
      setConfirmingDelete(false);
      return;
    }
    onClose();
    navigate(sequence.user ? userGetProfileUrl(sequence.user) : "/library");
  };

  return <LWDialog open onClose={onClose}>
    <DialogTitle>Sequence settings</DialogTitle>
    <DialogContent>
      <div className={classes.section}>
        <div className={classes.sectionTitle}>Card image</div>
        <div className={classes.cardImageRow}>
          {sequence.gridImageId && <CloudinaryImage2 publicId={sequence.gridImageId} width={203} height={80} />}
          <Button onClick={uploadCardImage}>{sequence.gridImageId ? "Replace card image" : "Upload card image"}</Button>
          {sequence.gridImageId && <Button onClick={() => updateSequence({ gridImageId: null })}>Remove</Button>}
        </div>
      </div>

      <div className={classes.section}>
        <form.Field name="hideFromAuthorPage" listeners={{ onChange: ({ value }) => updateSequence({ hideFromAuthorPage: value }) }}>
          {(field) => <FormComponentCheckbox field={field} label="Hide from my user profile" />}
        </form.Field>
        {userIsMemberOf(currentUser, 'alignmentVoters') &&
          <form.Field name="af" listeners={{ onChange: ({ value }) => updateSequence({ af: value }) }}>
            {(field) => <FormComponentCheckbox field={field} label="Alignment Forum" />}
          </form.Field>
        }
      </div>

      {userIsAdminOrMod(currentUser) && <div className={classes.section}>
        <div className={classes.sectionTitle}>Admin options</div>
        {userIsAdmin(currentUser) && <div className={classes.field}>
          <form.Field name="userId" listeners={{ onChange: ({ value }) => value && updateSequence({ userId: value }) }}>
            {(field) => <FormUserSelect field={field} label="Set author" />}
          </form.Field>
        </div>}
        {userIsAdmin(currentUser) && <div className={classes.field}>
          <form.Field name="curatedOrder" listeners={{ onBlur: ({ value }) => updateSequence({ curatedOrder: value }) }}>
            {(field) => <MuiTextField field={field} type="number" label="Curated order" />}
          </form.Field>
        </div>}
        <div className={classes.field}>
          <form.Field name="userProfileOrder" listeners={{ onBlur: ({ value }) => updateSequence({ userProfileOrder: value }) }}>
            {(field) => <MuiTextField field={field} type="number" label="User profile order" />}
          </form.Field>
        </div>
        {userIsAdmin(currentUser) && <div className={classes.field}>
          <form.Field name="canonicalCollectionSlug" listeners={{ onBlur: ({ value }) => updateSequence({ canonicalCollectionSlug: value }) }}>
            {(field) => <MuiTextField field={field} label="Collection slug" />}
          </form.Field>
        </div>}
        <form.Field name="hidden" listeners={{ onChange: ({ value }) => updateSequence({ hidden: value }) }}>
          {(field) => <FormComponentCheckbox field={field} label="Hidden (not listed or searchable, but reachable by link)" />}
        </form.Field>
        <form.Field name="noindex" listeners={{ onChange: ({ value }) => updateSequence({ noindex: value }) }}>
          {(field) => <FormComponentCheckbox field={field} label="Noindex" />}
        </form.Field>
      </div>}

      <div className={classes.deleteRow}>
        {confirmingDelete
          ? <>
              <span>Delete this sequence? It will be hidden from the whole site.</span>
              <Button className={classes.deleteButton} onClick={deleteSequence}>Delete</Button>
              <Button onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </>
          : <Button className={classes.deleteButton} onClick={() => setConfirmingDelete(true)}>Delete sequence</Button>
        }
      </div>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Done</Button>
    </DialogActions>
  </LWDialog>;
};

export default SequenceSettingsDialog;
