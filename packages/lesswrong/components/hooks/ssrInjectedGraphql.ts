export function getSsrInjectedGraphqlLoaderScript() {
  // This script sets up a small global API for SSR-injected GraphQL results.
  //
  // Why this exists:
  // - During streaming SSR + hydration, a component can render on the client
  //   before the <script> tag that injects its query result has been executed.
  // - We want hooks to be able to "wait for injection" during hydration, and
  //   we want injection to notify those waiters.
  //
  // Also:
  // - Dedupe-store deltas must be applied before query payloads that can
  //   reference them.
  return `(function(){
    if (window.__lwSsrGql) return;

    const subscribersByKey = new Map();
    function ensureInjectedStore() {
      return (window.__LW_SSR_GQL__ ??= {});
    }
    function ensureStoreMap() {
      return (window.__LW_SSR_GQL_STORE_MAP__ ??= new Map());
    }
    function notify(key) {
      const subs = subscribersByKey.get(key);
      if (!subs) return;
      for (const fn of Array.from(subs)) {
        fn();
      }
    }

    window.__lwSsrGql = {
      get(key) {
        const store = window.__LW_SSR_GQL__;
        return store ? store[key] : undefined;
      },
      subscribe(key, cb) {
        let subs = subscribersByKey.get(key);
        if (!subs) {
          subs = new Set();
          subscribersByKey.set(key, subs);
        }
        subs.add(cb);
        return function unsubscribe() {
          subs.delete(cb);
          if (subs.size === 0) subscribersByKey.delete(key);
        };
      },
      inject(key, payload, storeDelta) {
        // Apply dedupe-store changes first.
        if (storeDelta && typeof storeDelta === "object") {
          const m = ensureStoreMap();
          for (const k in storeDelta) {
            m.set(k, storeDelta[k]);
          }
        }
        ensureInjectedStore()[key] = payload;
        notify(key);
      },
    };
  })();`;
}

