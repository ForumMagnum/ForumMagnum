import "./integrationTestSetup";
import { getSqlClientOrThrow } from "../server/sql/sqlClient";
import ForumEventsRepo from "../server/repos/ForumEventsRepo";

/**
 * Tests for the multiple-choice poll storage in ForumEventsRepo. Multiple-choice
 * polls are stored with eventFormat "POLL" and their answers/mode/votes live in
 * the `publicData` JSONB column (see forumEventCallbacks.upsertMcPoll).
 */
describe("ForumEventsRepo multiple-choice polls", () => {
  // Construct the repo inside a hook, not at module load: AbstractRepo needs the
  // SQL client, which the integration test harness only initialises in its setup.
  let repo: ForumEventsRepo;
  beforeAll(() => {
    repo = new ForumEventsRepo();
  });

  const insertMcEvent = async (_id: string) => {
    const db = getSqlClientOrThrow();
    await db.none(`
      INSERT INTO "ForumEvents" ("_id", "title", "startDate", "eventFormat", "isGlobal")
      VALUES ($1, 'Test MC poll', NOW(), 'POLL', false)
    `, [_id]);
  };

  const getPublicData = async (_id: string) => {
    const db = getSqlClientOrThrow();
    const row = await db.one(`SELECT "publicData" FROM "ForumEvents" WHERE "_id" = $1`, [_id]);
    return row.publicData;
  };

  it("setMcPollOptions writes answers + mode into publicData", async () => {
    const _id = "mc-opts";
    await insertMcEvent(_id);
    await repo.setMcPollOptions({
      forumEventId: _id,
      answers: [{ _id: "a1", text: "Global health" }, { _id: "a2", text: "Animal welfare" }],
      multiSelect: true,
    });

    const publicData = await getPublicData(_id);
    expect(publicData.answers).toEqual([
      { _id: "a1", text: "Global health" },
      { _id: "a2", text: "Animal welfare" },
    ]);
    expect(publicData.multiSelect).toBe(true);
  });

  it("addMcVote / getMcUserVote / removeMcVote round-trip, and editing options preserves votes", async () => {
    const _id = "mc-votes";
    await insertMcEvent(_id);
    await repo.setMcPollOptions({
      forumEventId: _id,
      answers: [{ _id: "a1", text: "A" }, { _id: "a2", text: "B" }],
      multiSelect: true,
    });

    await repo.addMcVote(_id, "user1", { answerIds: ["a1", "a2"] });
    expect(await repo.getMcUserVote(_id, "user1")).toEqual({ answerIds: ["a1", "a2"] });

    // Re-submitting replaces the user's selection.
    await repo.addMcVote(_id, "user1", { answerIds: ["a2"] });
    expect(await repo.getMcUserVote(_id, "user1")).toEqual({ answerIds: ["a2"] });

    // Editing the answer options must not clobber existing votes.
    await repo.setMcPollOptions({
      forumEventId: _id,
      answers: [{ _id: "a1", text: "A (edited)" }, { _id: "a2", text: "B" }],
      multiSelect: false,
    });
    expect(await repo.getMcUserVote(_id, "user1")).toEqual({ answerIds: ["a2"] });

    await repo.removeMcVote(_id, "user1");
    expect(await repo.getMcUserVote(_id, "user1")).toBeNull();
  });
});
