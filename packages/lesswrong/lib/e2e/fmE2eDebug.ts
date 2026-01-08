type FmE2eEvent = {
  t: number;
  type: string;
  data?: unknown;
};

export type FmE2eDebug = {
  enabled: boolean;
  events: FmE2eEvent[];
  push: (type: string, data?: unknown) => void;
  reset: () => void;
};

declare global {
  interface Window {
    __fmE2E?: FmE2eDebug;
  }
}

export function getFmE2eDebug(): FmE2eDebug | null {
  if (typeof window === "undefined") return null;
  if (process.env.E2E !== "true") return null;

  if (!window.__fmE2E) {
    window.__fmE2E = {
      enabled: true,
      events: [],
      push(type: string, data?: unknown) {
        this.events.push({ t: Date.now(), type, data });
      },
      reset() {
        this.events = [];
      },
    };
  }
  return window.__fmE2E;
}


