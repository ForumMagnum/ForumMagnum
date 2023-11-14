import React, { useCallback } from "react";
import { Components, getFragment, registerComponent } from "../../../lib/vulcan-lib";
import { userIsAdmin } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";
import { useLocation } from "../../../lib/routeUtil";
import { useMessages } from "../../common/withMessages";
import { useDialog } from "../../common/withDialog";
import { Link, useNavigate } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    margin: "0 auto",
    padding: "0 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "20px",
    width: 600,
    maxWidth: "100%",
    "& .MuiFormControl-root, & .form-input, & .vulcan-form": {
      width: "100%",
    },
    "& .MuiButtonBase-root": {
      width: 84,
      marginLeft: 4,
    },
    "& .FormComponentInner-formComponentClear": {
      display: "none",
    },
  },
  link: {
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: '22px',
  },
});

const EditElectionCandidate = ({classes}: {
  classes: ClassesType,
}) => {
  const {flash} = useMessages();
  const navigate = useNavigate();
  const {openDialog} = useDialog();
  const {params} = useLocation();
  const candidateId = params.id;
  const isNewForm = candidateId === "new";
  const fragment = getFragment("ElectionCandidateBasicInfo");

  const successCallback = useCallback(() => {
    flash("Success");
    navigate({pathname: "/admin/election-candidates"});
  }, [flash, navigate]);

  const deleteCallback = useCallback(() => {
    if (!isNewForm) {
      openDialog({
        componentName: "DeleteElectionCandidateDialog",
        componentProps: {
          candidateId,
        },
      });
    }
  }, [isNewForm, openDialog, candidateId]);

  const currentUser = useCurrentUser();
  if (!userIsAdmin(currentUser)) {
    const {Error404} = Components;
    return (
      <Error404 />
    );
  }

  const {SectionTitle, WrappedSmartForm, EAButton} = Components;
  return (
    <div className={classes.root}>
      <SectionTitle
        title={`${isNewForm ? "New" : "Edit"} election candidate`}
      />
      <WrappedSmartForm
        key={candidateId}
        collectionName="ElectionCandidates"
        documentId={isNewForm ? undefined : candidateId}
        queryFragment={fragment}
        mutationFragment={fragment}
        successCallback={successCallback}
      />
      {!isNewForm &&
        <EAButton onClick={deleteCallback} variant="outlined">
          Delete
        </EAButton>
      }
      <div>
        <Link to="/admin/election-candidates" className={classes.link}>
          Back to election candidates
        </Link>
      </div>
    </div>
  );
}

const EditElectionCandidateComponent = registerComponent(
  "EditElectionCandidate",
  EditElectionCandidate,
  {styles},
);

declare global {
  interface ComponentTypes {
    EditElectionCandidate: typeof EditElectionCandidateComponent;
  }
}
