import React, { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import LWDialog from "../common/LWDialog";
import { DialogTitle } from "../widgets/DialogTitle";
import { DialogContent } from "../widgets/DialogContent";
import { DialogActions } from "../widgets/DialogActions";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { MuiTextField } from "../form-components/MuiTextField";
import { FormUserSelect } from "../form-components/UserSelect";
import { useCurrentUser } from "../common/withUser";
import { userIsAdmin, userIsAdminOrMod, userIsMemberOf } from "@/lib/vulcan-users/permissions";
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
  field: {
    marginBottom: 8,
  },
}));

/**
 * Settings that aren't part of the page layout, in sections like the post
 * editor's settings panel. The card image is set in the preview panel at the
 * bottom of the page, and Delete is in the bottom bar's "…" menu.
 */
const SequenceSettingsDialog = ({ onClose }: { onClose: () => void }) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { sequence, saveSequenceNow } = useSequenceEditor();

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

  // Settings save as soon as they change. If a save fails, put the form back
  // to the last saved values so it doesn't show a setting the server didn't take.
  const lastSavedValuesRef = useRef(form.state.values);
  const saveSetting = (data: UpdateSequenceDataInput) => {
    void saveSequenceNow(data).then((saved) => {
      if (saved) {
        lastSavedValuesRef.current = form.state.values;
      } else {
        form.reset(lastSavedValuesRef.current);
      }
    });
  };

  return <LWDialog open onClose={onClose}>
    <DialogTitle>Settings</DialogTitle>
    <DialogContent>
      <div className={classes.section}>
        <div className={classes.sectionTitle}>Visibility</div>
        <form.Field name="hideFromAuthorPage" listeners={{ onChange: ({ value }) => saveSetting({ hideFromAuthorPage: value }) }}>
          {(field) => <FormComponentCheckbox field={field} label="Hide from my user profile" />}
        </form.Field>
        {userIsMemberOf(currentUser, 'alignmentVoters') &&
          <form.Field name="af" listeners={{ onChange: ({ value }) => saveSetting({ af: value }) }}>
            {(field) => <FormComponentCheckbox field={field} label="Alignment Forum" />}
          </form.Field>
        }
      </div>

      {userIsAdminOrMod(currentUser) && <div className={classes.section}>
        <div className={classes.sectionTitle}>Admin Controls</div>
        {userIsAdmin(currentUser) && <div className={classes.field}>
          <form.Field name="userId" listeners={{ onChange: ({ value }) => value && saveSetting({ userId: value }) }}>
            {(field) => <FormUserSelect field={field} label="Set author" />}
          </form.Field>
        </div>}
        {userIsAdmin(currentUser) && <div className={classes.field}>
          <form.Field name="curatedOrder" listeners={{ onBlur: ({ value }) => saveSetting({ curatedOrder: value }) }}>
            {(field) => <MuiTextField field={field} type="number" label="Curated order" />}
          </form.Field>
        </div>}
        <div className={classes.field}>
          <form.Field name="userProfileOrder" listeners={{ onBlur: ({ value }) => saveSetting({ userProfileOrder: value }) }}>
            {(field) => <MuiTextField field={field} type="number" label="User profile order" />}
          </form.Field>
        </div>
        {userIsAdmin(currentUser) && <div className={classes.field}>
          <form.Field name="canonicalCollectionSlug" listeners={{ onBlur: ({ value }) => saveSetting({ canonicalCollectionSlug: value }) }}>
            {(field) => <MuiTextField field={field} label="Collection slug" />}
          </form.Field>
        </div>}
        <form.Field name="hidden" listeners={{ onChange: ({ value }) => saveSetting({ hidden: value }) }}>
          {(field) => <FormComponentCheckbox field={field} label="Hidden (not listed or searchable, but reachable by link)" />}
        </form.Field>
        <form.Field name="noindex" listeners={{ onChange: ({ value }) => saveSetting({ noindex: value }) }}>
          {(field) => <FormComponentCheckbox field={field} label="Noindex" />}
        </form.Field>
      </div>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Done</Button>
    </DialogActions>
  </LWDialog>;
};

export default SequenceSettingsDialog;
