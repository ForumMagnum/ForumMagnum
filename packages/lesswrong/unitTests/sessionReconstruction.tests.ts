import { buildBootstrapJsonl } from "../server/research/sessionReconstruction";

/** Build a minimal event row for the reconstructor (only the fields it reads). */
function evt(partial: { _id: string; payload: unknown; createdAt?: Date }): DbResearchConversationEvent {
  return {
    _id: partial._id,
    createdAt: partial.createdAt ?? new Date("2026-06-01T00:00:00.000Z"),
    payload: partial.payload,
  } as unknown as DbResearchConversationEvent;
}

function parseLines(lines: string[]): Array<Record<string, unknown>> {
  return lines.map((l) => JSON.parse(l));
}

describe("buildBootstrapJsonl", () => {
  it("keeps a uuid on every line and chains parentUuid through them", () => {
    const events = [
      evt({ _id: "e1", payload: { type: "user", uuid: "u1", session_id: "old", message: { role: "user", content: "hi" } } }),
      evt({ _id: "e2", payload: { type: "assistant", uuid: "a1", session_id: "old", message: { role: "assistant", content: "yo" } } }),
    ];
    const out = parseLines(buildBootstrapJsonl(events, "new-session"));
    (out.length as any).should.be.equal(2);

    // Each line carries its uuid, and session_id is renamed to sessionId.
    (out[0].uuid as any).should.be.equal("u1");
    (out[1].uuid as any).should.be.equal("a1");
    (out[0].sessionId as any).should.be.equal("new-session");
    (("session_id" in out[0]) as any).should.be.equal(false);

    // The chain: first line roots at null; the second points at the first.
    (out[0].parentUuid === null).should.be.equal(true);
    (out[1].parentUuid as any).should.be.equal("u1");
  });

  it("falls back to the event _id as uuid when the payload carries no top-level uuid", () => {
    // A replayed user turn / backfilled row may have a `message` but no `uuid`.
    const events = [
      evt({ _id: "ev-fallback", payload: { type: "user", session_id: "old", message: { role: "user", content: "hi" } } }),
      evt({ _id: "ev-next", payload: { type: "assistant", uuid: "a1", session_id: "old", message: { role: "assistant", content: "yo" } } }),
    ];
    const out = parseLines(buildBootstrapJsonl(events, "s"));
    (out[0].uuid as any).should.be.equal("ev-fallback");
    // The next line chains to the synthesized uuid, not to a missing id.
    (out[1].parentUuid as any).should.be.equal("ev-fallback");
  });

  it("drops system/result/error lines (they don't appear in real session files)", () => {
    const events = [
      evt({ _id: "e1", payload: { type: "user", uuid: "u1", message: { role: "user", content: "hi" } } }),
      evt({ _id: "e2", payload: { type: "result", subtype: "success" } }),
      evt({ _id: "e3", payload: { type: "system", subtype: "init" } }),
      evt({ _id: "e4", payload: { type: "assistant", uuid: "a1", message: { role: "assistant", content: "yo" } } }),
    ];
    const out = parseLines(buildBootstrapJsonl(events, "s"));
    (out.length as any).should.be.equal(2);
    // The dropped lines don't break the chain: assistant still points at user.
    (out[1].parentUuid as any).should.be.equal("u1");
  });

  it("chains sub-agent (sidechain) events within their own group", () => {
    const events = [
      evt({ _id: "e1", payload: { type: "user", uuid: "u1", message: { role: "user", content: "go" } } }),
      evt({ _id: "e2", payload: { type: "assistant", uuid: "a1", message: { role: "assistant", content: "spawning" } } }),
      // Sub-agent events share a parent_tool_use_id; they chain to each other,
      // not to the mainline event that happened to precede them in seq order.
      evt({ _id: "e3", payload: { type: "assistant", uuid: "s1", parent_tool_use_id: "task1", message: { role: "assistant", content: "sub a" } } }),
      evt({ _id: "e4", payload: { type: "assistant", uuid: "s2", parent_tool_use_id: "task1", message: { role: "assistant", content: "sub b" } } }),
    ];
    const out = parseLines(buildBootstrapJsonl(events, "s"));
    const byUuid = new Map(out.map((l) => [l.uuid as string, l]));
    (byUuid.get("s1")!.parentUuid === null).should.be.equal(true);
    (byUuid.get("s1")!.isSidechain as any).should.be.equal(true);
    (byUuid.get("s2")!.parentUuid as any).should.be.equal("s1");
  });
});
