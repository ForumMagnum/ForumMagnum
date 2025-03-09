import "./integrationTestSetup";
import MongoStore from "../server/vendor/ConnectMongo/MongoStore";
import ExpressSession, { SessionData } from "express-session";
import { promisify } from "util";
import { Sessions } from "../server/collections/sessions/collection";

const makeCookie = () => {
  const cookie = new ExpressSession.Cookie();
  cookie.maxAge = 10000; // This sets cookie.expire through a setter
  cookie.secure = true;
  cookie.domain = "cow.com";
  cookie.sameSite = false;
  return cookie;
}

const makeDataNoCookie = () => {
  return {
    foo: "bar",
    baz: {
      cow: "moo",
      chicken: "cluck",
    },
    num: 1,
    cookie: {},
  } as unknown as SessionData;
}

const makeData = () => {
  return {
    ...makeDataNoCookie(),
    cookie: makeCookie(),
  };
}

const createStoreHelper = () => {
  const store = new MongoStore({
    collection: Sessions,
  });

  const storePromise = {
    length: promisify(store.length).bind(store),
    clear: promisify(store.clear).bind(store),
    get: promisify(store.get).bind(store),
    set: promisify(store.set).bind(store),
    all: promisify(store.all).bind(store),
    touch: promisify(store.touch).bind(store),
    destroy: promisify(store.destroy).bind(store),
  }

  return { store, storePromise };
}

let state: ReturnType<typeof createStoreHelper>;

beforeAll(async () => {
  state = createStoreHelper();
  await state.storePromise.clear().catch((err) => {
    if (err.message.match(/ns not found/)) {
      return null;
    } else {
      throw err;
    }
  });
});

describe("Sessions", () => {
  it("Can create store with client promise", async () => {
    const store = new MongoStore({
      collection: Sessions,
    });
    expect(store).toBeDefined();
    expect(store.getCollection()).toBe(Sessions);
  });
  it("Store length should be 0", async () => {
    const length = await state.storePromise.length();
    expect(length).toBe(0);
  });
  it("Getting a non-existant session returns null", async () => {
    const result = await state.storePromise.get("a-nonexistant-session-id");
    expect(result).toBeNull();
  });
  it("Getting all sessions works when there are no sessions", async () => {
    const result = await state.storePromise.all();
    expect(result).toEqual([]);
  });
  it("Can use basic session flow", async () => {
    const sessionId = "test-basic-flow";
    const sessionData = makeData();
    const result = await state.storePromise.set(sessionId, sessionData);
    expect(result).toBeUndefined();
    const retrievedSession = await state.storePromise.get(sessionId);
    const serializedSession = JSON.parse(JSON.stringify(sessionData));
    expect(retrievedSession).toEqual(serializedSession);
    const allSessions = await state.storePromise.all();
    expect(allSessions).toEqual([serializedSession]);
    const length = await state.storePromise.length();
    expect(length).toBe(1);
    const error = await state.storePromise.destroy(sessionId);
    expect(error).toBeUndefined();
    const afterLength = await state.storePromise.length();
    expect(afterLength).toBe(0);
  });
  it("Can touch a session", async () => {
    const sessionId = "test-touch";
    const sessionData = makeDataNoCookie();
    await state.storePromise.set(sessionId, sessionData);
    const collection = state.store.getCollection();
    const session = await collection.findOne({ _id: sessionId });
    expect(session).toBeDefined();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await state.storePromise.touch(sessionId, session?.session);
    const session2 = await collection.findOne({ _id: sessionId });
    expect(session2).toBeDefined();
    const time1 = session?.expires?.getTime() ?? 0;
    const time2 = session2?.expires?.getTime() ?? 0;
    expect(time1).toBeGreaterThan(0);
    expect(time2).toBeGreaterThan(time1);
  });
  test("Can create 'set' event callback", (done) => {
    const sessionId = "test-set-event";
    const sessionData = makeData();
    const serializedSession = JSON.parse(JSON.stringify(sessionData));
    state.store.on("set", (sid) => {
      expect(sid).toBe(sessionId);
      state.store.get(sid, (error, session) => {
        expect(error).toBeNull();
        expect(session).toEqual(serializedSession);
        done()
      });
    });
    void state.store.set(sessionId, sessionData);
  });
  test("Can create 'create' event callback", (done) => {
    const sessionId = "test-create-event";
    const sessionData = makeData();
    const serializedSession = JSON.parse(JSON.stringify(sessionData));
    state.store.on("create", (sid) => {
      expect(sid).toBe(sessionId);
      state.store.get(sid, (error, session) => {
        expect(error).toBeNull();
        expect(session).toEqual(serializedSession);
        done();
      });
    });
    void state.store.set(sessionId, sessionData);
  });
  test("Can create 'update' event callback", (done) => {
    const sessionId = "test-update-event";
    const sessionData = makeData();
    const sessionUpdate = { ...sessionData, foo: "new-bar" } as SessionData;
    const serializedSession = JSON.parse(JSON.stringify(sessionUpdate));
    state.store.on("update", (sid) => {
      expect(sid).toBe(sessionId);
      state.store.get(sid, (error, session) => {
        expect(error).toBeNull();
        expect(session).toEqual(serializedSession);
        done();
      });
    });
    void state.store.set(sessionId, sessionData).then(() => {
      void state.store.set(sessionId, sessionUpdate);
    })
  });
});
