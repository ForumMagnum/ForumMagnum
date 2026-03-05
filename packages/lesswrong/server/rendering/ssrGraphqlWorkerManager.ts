import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";
import type { ExecutionResult } from "graphql";
import type { WorkerContextInitPayload, WorkerRequestMessage, WorkerResponseMessage, WorkerRunQueryPayload } from "./ssrGraphqlWorkerProtocol";

// Ensure this module is bundled for server builds.
import "@/server/rendering/ssrGraphqlWorkerThread";

const SSR_GRAPHQL_WORKER_KIND = "lw-ssr-graphql";
const DEFAULT_RPC_TIMEOUT_MS = 10_000;

interface InflightRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface WorkerStats {
  starts: number;
  restarts: number;
  rpcTimeouts: number;
  fallbacks: number;
}

declare global {
  var ssrGraphqlWorkerManager: SSRGraphqlWorkerManager | undefined;
}

class SSRGraphqlWorkerManager {
  private worker: Worker | null = null;
  private nextMessageId = 1;
  private inflight = new Map<number, InflightRequest>();
  private stats: WorkerStats = {
    starts: 0,
    restarts: 0,
    rpcTimeouts: 0,
    fallbacks: 0,
  };

  private getWorkerScriptPath(): string {
    const workerPath = path.resolve(__dirname, "ssrGraphqlWorkerThread.js");
    if (!fs.existsSync(workerPath)) {
      throw new Error(`SSR GraphQL worker script not found at ${workerPath}`);
    }
    return workerPath;
  }

  private ensureWorker(): Worker {
    if (this.worker) {
      return this.worker;
    }

    const worker = new Worker(this.getWorkerScriptPath(), {
      workerData: { workerKind: SSR_GRAPHQL_WORKER_KIND },
    });

    worker.on("message", (message: WorkerResponseMessage) => {
      const inflight = this.inflight.get(message.messageId);
      if (!inflight) {
        return;
      }
      clearTimeout(inflight.timeoutId);
      this.inflight.delete(message.messageId);
      if (message.ok) {
        inflight.resolve(message.payload);
      } else {
        inflight.reject(new Error(message.error.message));
      }
    });

    worker.on("error", (error) => {
      // eslint-disable-next-line no-console
      console.error("SSR GraphQL worker error:", error);
      this.failInflight(error);
      this.worker = null;
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        // eslint-disable-next-line no-console
        console.error(`SSR GraphQL worker exited with code ${code}`);
      }
      this.failInflight(new Error(`SSR GraphQL worker exited with code ${code}`));
      this.worker = null;
      this.stats.restarts += 1;
    });

    this.worker = worker;
    this.stats.starts += 1;
    return worker;
  }

  private failInflight(error: Error): void {
    for (const [messageId, inflight] of this.inflight.entries()) {
      clearTimeout(inflight.timeoutId);
      inflight.reject(error);
      this.inflight.delete(messageId);
    }
  }

  private request<TResponse>(
    message: { type: WorkerRequestMessage["type"]; payload?: unknown },
    timeoutMs = DEFAULT_RPC_TIMEOUT_MS,
  ): Promise<TResponse> {
    const worker = this.ensureWorker();
    const messageId = this.nextMessageId++;
    const fullMessage: WorkerRequestMessage = { ...message, messageId } as WorkerRequestMessage;

    return new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.inflight.delete(messageId);
        this.stats.rpcTimeouts += 1;
        reject(new Error(`SSR GraphQL worker request timed out (${message.type})`));
      }, timeoutMs);

      this.inflight.set(messageId, { resolve: resolve as (value: unknown) => void, reject, timeoutId });
      worker.postMessage(fullMessage);
    });
  }

  async initContext(payload: WorkerContextInitPayload): Promise<void> {
    await this.request<{ initialized: boolean }>({
      type: "initContext",
      payload,
    });
  }

  async runQuery(payload: WorkerRunQueryPayload): Promise<ExecutionResult> {
    return await this.request<ExecutionResult>({
      type: "runQuery",
      payload,
    });
  }

  async disposeContext(requestId: string): Promise<void> {
    await this.request<{ disposed: boolean }>({
      type: "disposeContext",
      payload: { requestId },
    }, 5_000);
  }

  async health(): Promise<{ status: string; activeContexts: number }> {
    return await this.request<{ status: string; activeContexts: number }>({
      type: "health",
    }, 2_000);
  }

  recordFallback(): void {
    this.stats.fallbacks += 1;
  }

  getStats(): WorkerStats {
    return { ...this.stats };
  }
}

export function getSSRGraphqlWorkerManager(): SSRGraphqlWorkerManager {
  if (!globalThis.ssrGraphqlWorkerManager) {
    globalThis.ssrGraphqlWorkerManager = new SSRGraphqlWorkerManager();
  }
  return globalThis.ssrGraphqlWorkerManager;
}
