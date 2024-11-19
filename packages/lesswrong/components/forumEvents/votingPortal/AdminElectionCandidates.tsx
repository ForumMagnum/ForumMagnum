import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { userIsAdmin } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";
import { useElectionCandidates } from "./hooks";
import { Link } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: 1200,
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

const AdminElectionCandidates = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const {results, loading} = useElectionCandidates("name", {
    fetchPolicy: "network-only",
  });

  if (!userIsAdmin(currentUser)) {
    const {Error404} = Components;
    return (
      <Error404 />
    );
  }

  const {SectionTitle, Loading, EAButton, ForumIcon} = Components;
  return (
    <div className={classes.root}>
      <SectionTitle title="Election Candidates" centered />
      {loading && <Loading />}
      <div>
        {results?.map(({_id, name}) => (
          <div key={_id}>
            <Link
              to={`/admin/election-candidates/${_id}`}
              className={classes.link}
            >
              {name}
            </Link>
          </div>
        ))}
      </div>
      <EAButton href={`/admin/election-candidates/new`}>
        <ForumIcon icon="Plus" /> Add candidate
      </EAButton>
    </div>
  );
}

const AdminElectionCandidatesComponent = registerComponent(
  "AdminElectionCandidates",
  AdminElectionCandidates,
  {styles},
);

declare global {
  interface ComponentTypes {
    AdminElectionCandidates: typeof AdminElectionCandidatesComponent;
  }
}
