import "./integrationTestSetup";
import { randomId } from "../lib/random";
import { Votes } from "../server/collections/votes/collection";
import VotesRepo from "../server/repos/VotesRepo";
import { createManyDummyVotes } from "./utils";

const createVote = async (
  voterId: string,
  authorIds: string[],
  power: number,
  data: Partial<DbVote> = {},
) => {
  const [vote] = await createManyDummyVotes(
    1,
    { _id: voterId } as DbUser,
    { authorIds, power, ...data },
  );
  return vote;
};

const getNetKarmaChanges = async () => {
  const changes = await new VotesRepo().getNetKarmaChangesForAuthorsOverPeriod(30, 10_000);
  return new Map(changes.map(({ userId, netKarma }) => [userId, netKarma]));
};

describe("VotesRepo.getNetKarmaChangesForAuthorsOverPeriod", () => {
  it("excludes votes cast by an author or coauthor", async () => {
    const authorId = randomId();
    const coauthorId = randomId();

    await createVote(authorId, [authorId], 10);
    await createVote(coauthorId, [authorId, coauthorId], 7);
    await createVote(randomId(), [authorId, coauthorId], 5);

    const changes = await getNetKarmaChanges();
    expect(changes.get(authorId)).toBe(5);
    expect(changes.get(coauthorId)).toBe(5);
  });

  it("includes vote corrections made during the time window", async () => {
    const upgradeAuthorId = randomId();
    const downgradeAuthorId = randomId();
    const retractionAuthorId = randomId();
    const upgradeVoterId = randomId();
    const downgradeVoterId = randomId();
    const retractionVoterId = randomId();
    const fortyDaysAgo = new Date(Date.now() - (40 * 24 * 60 * 60 * 1000));

    const oldUpgrade = await createVote(upgradeVoterId, [upgradeAuthorId], 1, { cancelled: true });
    await Votes.rawUpdateOne(oldUpgrade._id, { $set: { votedAt: fortyDaysAgo } });
    await createVote(upgradeVoterId, [upgradeAuthorId], -1, { cancelled: true, isUnvote: true });
    await createVote(upgradeVoterId, [upgradeAuthorId], 2);

    const oldDowngrade = await createVote(downgradeVoterId, [downgradeAuthorId], 2, { cancelled: true });
    await Votes.rawUpdateOne(oldDowngrade._id, { $set: { votedAt: fortyDaysAgo } });
    await createVote(downgradeVoterId, [downgradeAuthorId], -2, { cancelled: true, isUnvote: true });
    await createVote(downgradeVoterId, [downgradeAuthorId], 1);

    const oldRetraction = await createVote(retractionVoterId, [retractionAuthorId], 1, { cancelled: true });
    await Votes.rawUpdateOne(oldRetraction._id, { $set: { votedAt: fortyDaysAgo } });
    await createVote(retractionVoterId, [retractionAuthorId], -1, { cancelled: true, isUnvote: true });

    const changes = await getNetKarmaChanges();
    expect(changes.get(upgradeAuthorId)).toBe(1);
    expect(changes.get(downgradeAuthorId)).toBe(-1);
    expect(changes.get(retractionAuthorId)).toBe(-1);
  });

  it("deduplicates authors within a vote without deduplicating separate votes", async () => {
    const authorId = randomId();
    const voterId = randomId();

    await createVote(voterId, [authorId, authorId], 3);
    await createVote(voterId, [authorId], 3);
    await createVote(voterId, [authorId], 3);

    const changes = await getNetKarmaChanges();
    expect(changes.get(authorId)).toBe(9);
  });
});
