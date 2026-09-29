import "./integrationTestSetup";
import { randomId } from "@/lib/random";
import RecommendationsCaches from "@/server/collections/recommendationsCaches/collection";
import RecommendationsCachesRepo from "@/server/repos/RecommendationsCachesRepo";

function makeRecommendation(overrides: Partial<DbRecommendationsCache> = {}): DbRecommendationsCache {
  return {
    _id: randomId(),
    schemaVersion: 1,
    createdAt: new Date(),
    legacyData: null,
    userId: randomId(),
    postId: randomId(),
    source: "recombee",
    scenario: "test-scenario",
    attributionId: randomId(),
    ttlMs: 60000,
    ...overrides,
  };
}

describe("RecommendationsCachesRepo", () => {
  it("preserves an existing recommendation and inserts non-conflicting posts", async () => {
    const repo = new RecommendationsCachesRepo();
    const existing = makeRecommendation();
    await repo.insertRecommendations([existing]);

    const duplicate = makeRecommendation({
      ...existing,
      _id: randomId(),
      attributionId: randomId(),
      createdAt: new Date(existing.createdAt.getTime() + 1000),
      ttlMs: 120000,
    });
    const newPost = makeRecommendation({ userId: existing.userId });
    await repo.insertRecommendations([duplicate, newPost]);

    const cached = await repo.getUserRecommendationsFromSource(existing.userId, existing.source, existing.scenario);
    expect(cached).toHaveLength(2);
    expect(cached).toEqual(expect.arrayContaining([existing, newPost]));
    expect(await repo.getUserRecommendationsFromSource(existing.userId, existing.source, existing.scenario)).toEqual([]);
  });

  it("accepts duplicate posts within a single refill", async () => {
    const repo = new RecommendationsCachesRepo();
    const recommendation = makeRecommendation();
    await repo.insertRecommendations([
      recommendation,
      { ...recommendation, _id: randomId() },
    ]);

    expect(await repo.getUserRecommendationsFromSource(
      recommendation.userId, recommendation.source, recommendation.scenario,
    )).toEqual([recommendation]);
  });

  it("accepts overlapping concurrent refills without losing distinct posts", async () => {
    const repo = new RecommendationsCachesRepo();
    const shared = makeRecommendation();
    const firstOnly = makeRecommendation({ userId: shared.userId });
    const secondOnly = makeRecommendation({ userId: shared.userId });
    const results = await Promise.allSettled([
      repo.insertRecommendations([shared, firstOnly]),
      repo.insertRecommendations([{ ...shared, _id: randomId() }, secondOnly]),
    ]);
    expect(results.map(result => result.status)).toEqual(["fulfilled", "fulfilled"]);

    const cached = await repo.getUserRecommendationsFromSource(shared.userId, shared.source, shared.scenario);
    expect(cached.map(rec => rec.postId).sort()).toEqual([shared.postId, firstOnly.postId, secondOnly.postId].sort());
  });

  it("keeps separate entries for different users, sources, and scenarios", async () => {
    const repo = new RecommendationsCachesRepo();
    const recommendation = makeRecommendation();
    const entries = [
      recommendation,
      makeRecommendation({ ...recommendation, _id: randomId(), userId: randomId() }),
      makeRecommendation({ ...recommendation, _id: randomId(), source: "vertex" }),
      makeRecommendation({ ...recommendation, _id: randomId(), scenario: "another-scenario" }),
    ];
    await repo.insertRecommendations(entries);

    for (const entry of entries) {
      expect(await repo.getUserRecommendationsFromSource(entry.userId, entry.source, entry.scenario)).toEqual([entry]);
    }
  });

  it("does not suppress unrelated primary key conflicts", async () => {
    const repo = new RecommendationsCachesRepo();
    const recommendation = makeRecommendation();
    await repo.insertRecommendations([recommendation]);

    await expect(repo.insertRecommendations([
      { ...recommendation, postId: randomId() },
    ])).rejects.toMatchObject({ code: "23505" });
    await RecommendationsCaches.rawRemove({ _id: recommendation._id });
  });

  it("accepts an empty refill", async () => {
    await expect(new RecommendationsCachesRepo().insertRecommendations([])).resolves.toBeUndefined();
  });
});
