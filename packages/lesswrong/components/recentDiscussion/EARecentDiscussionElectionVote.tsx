import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  link: {
    color: theme.palette.grey[1000],
  },
});

const EARecentDiscussionElectionVote = ({electionVote, classes}: {
  electionVote: ElectionVoteRecentDiscussion,
  classes: ClassesType,
}) => {
  if (!electionVote.submittedAt) {
    return null;
  }
  const {EARecentDiscussionItem} = Components;
  return (
    <EARecentDiscussionItem
      icon="Voted"
      iconVariant="givingSeason"
      action={
        <>
          voted in the <Link to="/voting-portal" className={classes.link}>
            Donation Election
          </Link>
        </>
      }
      timestamp={electionVote.submittedAt}
      anonymous
    />
  );
}

const EARecentDiscussionElectionVoteComponent = registerComponent(
  "EARecentDiscussionElectionVote",
  EARecentDiscussionElectionVote,
  {styles},
);

declare global {
  interface ComponentTypes {
    EARecentDiscussionElectionVote: typeof EARecentDiscussionElectionVoteComponent,
  }
}
