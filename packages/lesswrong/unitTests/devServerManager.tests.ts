import { SpawnOptions } from "node:child_process";
import { EventEmitter } from "node:events";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createDevServerManager } from "../server/research/sandbox/supervisor/devServerManager";

interface SpawnCall {
  command: string;
  args: string[];
  options: SpawnOptions;
}

class FakeDevChild extends EventEmitter {
  pid = 4321;
  unref = jest.fn();

  exit(code: number | null, signal: NodeJS.Signals | null): void {
    this.emit("exit", code, signal);
  }
}

function makeSandboxFiles() {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "dev-server-manager-"));
  const devScriptPath = path.join(tmpDir, "dev-server.sh");
  const devLogPath = path.join(tmpDir, "dev.log");
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(devScriptPath, "#!/usr/bin/env sh\nexec sleep 60\n");
  return { tmpDir, devScriptPath, devLogPath };
}

describe("devServerManager", () => {
  it("launches dev-server.sh detached and unrefs the child", () => {
    const { tmpDir, devScriptPath, devLogPath } = makeSandboxFiles();
    try {
      writeFileSync(devLogPath, "old log");
      const child = new FakeDevChild();
      const calls: SpawnCall[] = [];
      const manager = createDevServerManager(() => undefined, {
        devScriptPath,
        devLogPath,
        cwd: tmpDir,
        probe: { isListening: async () => false },
        spawnProcess: (command, args, options) => {
          calls.push({ command, args, options });
          return child;
        },
      });

      manager.start();

      expect(calls).toHaveLength(1);
      expect(calls[0].command).toBe("sh");
      expect(calls[0].args).toEqual([devScriptPath]);
      expect(calls[0].options.cwd).toBe(tmpDir);
      expect(calls[0].options.detached).toBe(true);
      expect(child.unref).toHaveBeenCalledTimes(1);
      expect(readFileSync(devLogPath, "utf8")).toBe("");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("stops the whole detached process group", () => {
    const { tmpDir, devScriptPath, devLogPath } = makeSandboxFiles();
    const killSpy = jest.spyOn(process, "kill").mockReturnValue(true);
    try {
      const child = new FakeDevChild();
      const manager = createDevServerManager(() => undefined, {
        devScriptPath,
        devLogPath,
        cwd: tmpDir,
        probe: { isListening: async () => false },
        spawnProcess: () => child,
      });

      manager.start();
      manager.stop();
      child.exit(null, "SIGTERM");

      expect(killSpy).toHaveBeenCalledWith(-child.pid, "SIGTERM");
    } finally {
      killSpy.mockRestore();
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
