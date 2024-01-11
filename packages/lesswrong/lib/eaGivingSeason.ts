import moment from "moment";

export const eaGivingSeason23ElectionName = "givingSeason23";

/** Approximately the time the election was accounced: https://forum.effectivealtruism.org/posts/x2KfyNe8oPR4dqGkf/ea-forum-plans-for-giving-season-2023 */
const votingAccountCreationCutoff = new Date("2023-10-23T19:00:00Z");

export const userCanVoteInDonationElection = (
  user: UsersCurrent | DbUser | null,
) =>
  !!user && new Date(user.createdAt).getTime() < votingAccountCreationCutoff.getTime()

export const assertUserCanVoteInDonationElection = (
  user: UsersCurrent | DbUser | null,
) => {
  if (!userCanVoteInDonationElection(user)) {
    const date = moment(votingAccountCreationCutoff).format("Do MMMM YYYY");
    throw new Error(`To vote in this election your account must be created before ${date}`);
  }
}
