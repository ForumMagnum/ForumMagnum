import { waitForProviderFlush } from "../../../app/api/agent/editorAgentUtil";

interface MutableProviderState {
  unsynced: boolean
  bufferedAmount: number
  acknowledgePersistence: boolean
  persistenceRequests: number
}

function createProviderState(
  overrides: Partial<MutableProviderState> = {},
): MutableProviderState {
  return {
    unsynced: false,
    bufferedAmount: 0,
    acknowledgePersistence: true,
    persistenceRequests: 0,
    ...overrides,
  };
}

function createFlushableProvider(state: MutableProviderState) {
  let statelessCallbacks: Array<(data: { payload: string }) => void> = [];
  return {
    get hasUnsyncedChanges() {
      return state.unsynced;
    },
    configuration: {
      websocketProvider: {
        webSocket: {
          get bufferedAmount() {
            return state.bufferedAmount;
          },
        },
      },
    },
    on(_event: "stateless", callback: (data: { payload: string }) => void) {
      statelessCallbacks.push(callback);
    },
    off(_event: "stateless", callback: (data: { payload: string }) => void) {
      statelessCallbacks = statelessCallbacks.filter((candidate) => candidate !== callback);
    },
    sendStateless(payload: string) {
      state.persistenceRequests += 1;
      if (!state.acknowledgePersistence) return;
      const requestId = payload.slice(payload.lastIndexOf(":") + 1);
      setTimeout(() => {
        for (const callback of statelessCallbacks) {
          callback({ payload: `forum-magnum:persisted:${requestId}` });
        }
      }, 0);
    },
  };
}

describe("waitForProviderFlush", () => {
  it("waits for the server to acknowledge and persist updates after the send buffer drains", async () => {
    const state = createProviderState({ unsynced: true });
    const provider = createFlushableProvider(state);
    setTimeout(() => {
      state.unsynced = false;
    }, 10);

    await expect(waitForProviderFlush(provider, 100)).resolves.toBeUndefined();
    expect(state.persistenceRequests).toBe(1);
  });

  it("fails instead of reporting success when the server does not acknowledge an update", async () => {
    const state = createProviderState({ unsynced: true });
    const provider = createFlushableProvider(state);

    await expect(waitForProviderFlush(provider, 10)).rejects.toThrow(
      "Timed out waiting for Hocuspocus to acknowledge pending updates",
    );
    expect(state.persistenceRequests).toBe(0);
  });

  it("also waits for the WebSocket send buffer to drain", async () => {
    const state = createProviderState({ bufferedAmount: 10 });
    const provider = createFlushableProvider(state);
    setTimeout(() => {
      state.bufferedAmount = 0;
    }, 10);

    await expect(waitForProviderFlush(provider, 100)).resolves.toBeUndefined();
    expect(state.persistenceRequests).toBe(0);
  });

  it("fails instead of reporting success when persistence is not acknowledged", async () => {
    const state = createProviderState({
      unsynced: true,
      acknowledgePersistence: false,
    });
    const provider = createFlushableProvider(state);
    setTimeout(() => {
      state.unsynced = false;
    }, 5);

    await expect(waitForProviderFlush(provider, 10)).rejects.toThrow(
      "Timed out waiting for Hocuspocus to persist pending updates",
    );
    expect(state.persistenceRequests).toBe(1);
  });
});
