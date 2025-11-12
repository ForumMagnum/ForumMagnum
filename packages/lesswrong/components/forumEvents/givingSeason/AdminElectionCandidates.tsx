import React from "react";
import { useCurrentUser } from "../../common/withUser";
import { useElectionCandidates } from "./hooks";
import { Link } from "../../../lib/reactRouterWrapper";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import Error404 from "@/components/common/Error404";
import SectionTitle from "@/components/common/SectionTitle";
import Loading from "@/components/vulcan-core/Loading";
import EAButton from "@/components/ea-forum/EAButton";
import ForumIcon from "@/components/common/ForumIcon";
import { registerComponent } from "@/lib/vulcan-lib/components";

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
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {results, loading} = useElectionCandidates("name", {
    fetchPolicy: "network-only",
  });

  if (!userIsAdmin(currentUser)) {
    return (
      <Error404 />
    );
  }

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

export default registerComponent(
  "AdminElectionCandidates",
  AdminElectionCandidates,
  {styles},
);