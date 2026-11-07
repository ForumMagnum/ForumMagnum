import { HocuspocusProvider } from "@hocuspocus/provider";
import { syncYjsDocToLexical, type Binding, type Provider as LexicalProvider } from "@lexical/yjs";
import { $getRoot } from "lexical";
import type { Doc } from "yjs";

/**
 * The lifecycle of a HocuspocusProvider in a short-lived server-side session.
 *
 * lightcone-commons's lib/documents/headless/headlessProvider.ts and
 * ForumMagnum's app/api/agent/headlessProvider.ts are identical apart from
 * requireHocuspocusUrl. Change both together.
 */

const HOCUSPOCUS_SYNC_TIMEOUT_MS = 15_000;

function requireHocuspocusUrl(): string {
  const url = process.env.HOCUSPOCUS_URL;
  if (!url) {
    throw new Error("HOCUSPOCUS_URL is not configured");
  }

  return url;
}

export function createHeadlessProvider(configuration: {
  name: string;
  document: Doc;
  token: string;
  onSynced?: () => void;
}): HocuspocusProvider {
  const provider = new HocuspocusProvider({
    url: requireHocuspocusUrl(),
    connect: false,
    // Actually close the socket on destroy(). The default (true) leaves the
    // websocket manager connected with no provider attached. It holds the
    // socket open, and if the server drops the doc-less connection it
    // reconnects, can never authenticate, and eventually logs "An
    // authentication token is required…" noise.
    preserveConnection: false,
    // Sessions sync only through the server. Otherwise a concurrent session in
    // this process receives updates the server may never apply.
    broadcast: false,
    ...configuration,
  });

  // Updates made while the socket is down or closing are queued and sent after
  // the reconnect, on top of the sync step that already resends them. Their
  // extra acks take `unsyncedChanges` below the real count, so
  // waitForProviderFlush would confirm later updates before they're applied.
  provider.on("open", () => {
    provider.configuration.websocketProvider["messageQueue"] = [];
  });

  return provider;
}

interface ProviderStateWait {
  provider: HocuspocusProvider;
  event: "synced" | "unsyncedChanges";
  pending: () => number;
  timeoutMessage: () => string;
}

function waitForProviderState({ provider, event, pending, timeoutMessage }: ProviderStateWait): Promise<void> {
  if (pending() <= 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timeOut = () => {
      provider.off(event, handleChange);
      reject(new Error(timeoutMessage()));
    };

    let timeoutHandle = setTimeout(timeOut, HOCUSPOCUS_SYNC_TIMEOUT_MS);
    let fewestPending = pending();

    const handleChange = () => {
      const left = pending();
      if (left >= fewestPending) return;

      fewestPending = left;
      clearTimeout(timeoutHandle);
      if (left > 0) {
        timeoutHandle = setTimeout(timeOut, HOCUSPOCUS_SYNC_TIMEOUT_MS);
        return;
      }

      provider.off(event, handleChange);
      resolve();
    };

    provider.on(event, handleChange);
  });
}

export function waitForProviderSync(provider: HocuspocusProvider): Promise<void> {
  return waitForProviderState({
    provider,
    event: "synced",
    pending: () => (provider.synced ? 0 : 1),
    timeoutMessage: () => "Timed out waiting for Hocuspocus sync",
  });
}

/** The provider retries an unreachable server forever, so connect() alone never settles. */
function connectWithTimeout(provider: HocuspocusProvider): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutHandle = setTimeout(
      () => reject(new Error("Timed out connecting to Hocuspocus")),
      HOCUSPOCUS_SYNC_TIMEOUT_MS,
    );

    provider.connect().then(resolve, reject).finally(() => clearTimeout(timeoutHandle));
  });
}

/** Call inside a try whose finally destroys the provider, which is what stops a failed connection's retries. */
export async function connectAndSync(provider: HocuspocusProvider): Promise<void> {
  await connectWithTimeout(provider);
  await waitForProviderSync(provider);
}

/** Hocuspocus discards updates it hasn't applied when the provider is destroyed. */
export function waitForProviderFlush(provider: HocuspocusProvider): Promise<void> {
  return waitForProviderState({
    provider,
    event: "unsyncedChanges",
    pending: () => provider.unsyncedChanges,
    timeoutMessage: () => `Hocuspocus confirmed no updates to ${provider.configuration.name} for ${HOCUSPOCUS_SYNC_TIMEOUT_MS / 1000}s, with ${provider.unsyncedChanges} still unconfirmed`,
  });
}

export async function withProviderFlush<T>(provider: HocuspocusProvider, write: () => Promise<T>): Promise<T> {
  let result: T;
  try {
    result = await write();
  } catch (err) {
    await waitForProviderFlush(provider).catch((flushErr: unknown) => {
      // eslint-disable-next-line no-console
      console.error(`Hocuspocus didn't confirm the updates to ${provider.configuration.name} after a failed write`, flushErr);
    });

    throw err;
  }

  await waitForProviderFlush(provider);
  return result;
}

export function getLexicalCompatibleProvider(provider: HocuspocusProvider): HocuspocusProvider & LexicalProvider {
  if (!provider.awareness) {
    throw new Error("Hocuspocus provider awareness is not initialized");
  }

  return provider as HocuspocusProvider & LexicalProvider;
}

/**
 * Call after connectAndSync, then start observing the doc. A binding that
 * observes the first sync reads the doc before the orphan repair in onSynced,
 * and can't map the repair back onto its children once it has read an orphan.
 */
export function hydrateEditorFromDoc(binding: Binding, provider: LexicalProvider): void {
  syncYjsDocToLexical(binding, provider, () => {});
  // Commit the deferred COLLABORATION-tagged hydration now, or a caller update
  // batched into it would inherit the tag and never reach Yjs. Lexical only
  // clears the tag when something is dirty, hence markDirty for a doc that
  // hydrates nothing. Transforms stay off because what they change under this
  // tag never reaches Yjs either, leaving the binding out of step with the doc.
  binding.editor.update(() => $getRoot().markDirty(), { discrete: true, skipTransforms: true });
}
