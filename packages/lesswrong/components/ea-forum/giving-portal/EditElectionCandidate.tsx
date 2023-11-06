import React, { useCallback } from "react";
import { Components, getFragment, registerComponent } from "../../../lib/vulcan-lib";
import { userIsAdmin } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";
import { useLocation } from "../../../lib/routeUtil";
import { useSingle } from "../../../lib/crud/withSingle";
import { useMessages } from "../../common/withMessages";
import { Link } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
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
  const {params} = useLocation();
  const candidateId = params.id;

  const successCallback = useCallback(() => {
    flash("Success");
  }, [flash]);

  const currentUser = useCurrentUser();
  if (!userIsAdmin(currentUser)) {
    const {Error404} = Components;
    return (
      <Error404 />
    );
  }

  const {WrappedSmartForm} = Components;
  return (
    <div className={classes.root}>
      <WrappedSmartForm
        key={candidateId}
        collectionName="ElectionCandidates"
        documentId={candidateId}
        queryFragment={getFragment("ElectionCandidateBasicInfo")}
        mutationFragment={getFragment("ElectionCandidateBasicInfo")}
        successCallback={successCallback}
      />
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
