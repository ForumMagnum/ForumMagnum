import { createSaveQueue, type SaveStatus } from "@/components/sequenceEditor/useSequentialSaveQueue";

function deferred() {
  let resolve: () => void = () => {};
  let reject: (e: Error) => void = () => {};
  const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe("createSaveQueue", () => {
  it("runs saves one at a time, in the order they were enqueued", async () => {
    const events: string[] = [];
    const first = deferred();
    const queue = createSaveQueue({ onStatusChange: () => {}, onError: () => {} });

    queue.enqueue(async () => { events.push("first started"); await first.promise; events.push("first finished"); }, () => {});
    queue.enqueue(async () => { events.push("second started"); }, () => {});

    await Promise.resolve();
    expect(events).toEqual(["first started"]);

    first.resolve();
    await queue.drain();
    expect(events).toEqual(["first started", "first finished", "second started"]);
  });

  it("rolls back a failed save, reports the error, and keeps going", async () => {
    const rolledBack: string[] = [];
    const errors: Error[] = [];
    let secondRan = false;
    const queue = createSaveQueue({ onStatusChange: () => {}, onError: (e) => errors.push(e) });

    queue.enqueue(async () => { throw new Error("network down"); }, () => rolledBack.push("first"));
    queue.enqueue(async () => { secondRan = true; }, () => rolledBack.push("second"));
    await queue.drain();

    expect(rolledBack).toEqual(["first"]);
    expect(errors.map(e => e.message)).toEqual(["network down"]);
    expect(secondRan).toBe(true);
  });

  it("reports saving, then saved", async () => {
    const statuses: SaveStatus[] = [];
    const queue = createSaveQueue({ onStatusChange: (s) => statuses.push(s), onError: () => {} });
    queue.enqueue(async () => {}, () => {});
    await queue.drain();
    expect(statuses).toEqual(["saving", "saved"]);
  });

  it("reports error when the last save failed", async () => {
    const statuses: SaveStatus[] = [];
    const queue = createSaveQueue({ onStatusChange: (s) => statuses.push(s), onError: () => {} });
    queue.enqueue(async () => { throw new Error("nope"); }, () => {});
    await queue.drain();
    expect(statuses[statuses.length - 1]).toBe("error");
  });

  it("resolves drain immediately when nothing is queued", async () => {
    const queue = createSaveQueue({ onStatusChange: () => {}, onError: () => {} });
    await queue.drain();
  });
});
