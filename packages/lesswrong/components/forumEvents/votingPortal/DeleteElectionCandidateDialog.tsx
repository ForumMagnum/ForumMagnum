import React, { useCallback } from "react";
import { Components, getFragment, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { userIsAdmin } from "../../../lib/vulcan-users";
import { useDelete } from "../../../lib/crud/withDelete";
import { useMessages } from "../../common/withMessages";
import { useNavigate } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "0 20px 20px 20px",
  },
  buttons: {
    display: "flex",
    gap: "12px",
    marginTop: 10,
  },
});

const DeleteElectionCandidateDialog = ({candidateId, onClose, classes}: {
  candidateId: string,
  onClose: () => void,
  classes: ClassesType,
}) => {
  const {flash} = useMessages();
  const navigate = useNavigate();
  const {deleteDocument} = useDelete({
    collectionName: "ElectionCandidates",
    fragment: getFragment("ElectionCandidateBasicInfo"),
  });

  const deleteCallback = useCallback(async () => {
    try {
      await deleteDocument({
        selector: {
          _id: candidateId,
        },
      });
      onClose?.();
      flash("Candidate deleted");
      navigate({pathname: "/admin/election-candidates"});
    } catch (e) {
      flash(`Error: ${e.message}`);
    }
  }, [deleteDocument, candidateId, onClose, flash, navigate]);

  const currentUser = useCurrentUser();
  if (!userIsAdmin(currentUser)) {
    return null;
  }

  const {SectionTitle, LWDialog, EAButton} = Components;
  return (
    <LWDialog open onClose={onClose}>
      <div className={classes.root}>
        <SectionTitle title="Delete election candidate" />
        <div>Are you sure you want to delete this election candidate?</div>
        <div>This cannot be undone.</div>
        <div className={classes.buttons}>
          <EAButton onClick={onClose} variant="contained">
            No, cancel
          </EAButton>
          <EAButton onClick={deleteCallback} variant="outlined">
            Yes, delete
          </EAButton>
        </div>
      </div>
    </LWDialog>
  );
}

const DeleteElectionCandidateDialogComponent = registerComponent(
  "DeleteElectionCandidateDialog",
  DeleteElectionCandidateDialog,
  {styles},
);

declare global {
  interface ComponentTypes {
    DeleteElectionCandidateDialog: typeof DeleteElectionCandidateDialogComponent;
  }
}
