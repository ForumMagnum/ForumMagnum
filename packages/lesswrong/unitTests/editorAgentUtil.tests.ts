import { waitForProviderFlush } from "../../../app/api/agent/editorAgentUtil";

interface MutableProviderState {
  unsynced: boolean
  bufferedAmount: number
}

function createFlushableProvider(state: MutableProviderState) {
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
  };
}

describe("waitForProviderFlush", () => {
  it("waits for the server to acknowledge updates after the send buffer drains", async () => {
    const state = { unsynced: true, bufferedAmount: 0 };
    const provider = createFlushableProvider(state);
    setTimeout(() => {
      state.unsynced = false;
    }, 10);

    await expect(waitForProviderFlush(provider, 100)).resolves.toBeUndefined();
  });

  it("fails instead of reporting success when the server does not acknowledge an update", async () => {
    const state = { unsynced: true, bufferedAmount: 0 };
    const provider = createFlushableProvider(state);

    await expect(waitForProviderFlush(provider, 10)).rejects.toThrow(
      "Timed out waiting for Hocuspocus to acknowledge pending updates",
    );
  });

  it("also waits for the WebSocket send buffer to drain", async () => {
    const state = { unsynced: false, bufferedAmount: 10 };
    const provider = createFlushableProvider(state);
    setTimeout(() => {
      state.bufferedAmount = 0;
    }, 10);

    await expect(waitForProviderFlush(provider, 100)).resolves.toBeUndefined();
  });
});
