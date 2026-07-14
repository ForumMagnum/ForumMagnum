import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  installStagedSessionJsonl,
  SESSION_STAGING_SUFFIX,
  sessionJsonlExists,
  sessionJsonlPath,
} from "../server/research/sandbox/supervisor/sessionBootstrap";

async function writeFileWithDirs(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

describe("sessionBootstrap", () => {
  let tmpHome: string;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), "claude-bootstrap-"));
  });

  afterEach(async () => {
    await fs.rm(tmpHome, { recursive: true, force: true });
  });

  it("produces the expected on-disk path", () => {
    const p = sessionJsonlPath({
      claudeSessionId: "sess-1",
      cwd: "/vercel/sandbox",
      homeDir: "/home/v",
    });
    expect(p).toBe("/home/v/.claude/projects/-vercel-sandbox/sess-1.jsonl");
  });

  it("reports session-file existence", async () => {
    const target = { claudeSessionId: "exists-check", homeDir: tmpHome };
    expect(await sessionJsonlExists(target)).toBe(false);
    await writeFileWithDirs(sessionJsonlPath(target), '{"type":"user"}\n');
    expect(await sessionJsonlExists(target)).toBe(true);
  });

  describe("installStagedSessionJsonl", () => {
    it("renames a staged file into place when no session file exists", async () => {
      const target = { claudeSessionId: "install", homeDir: tmpHome };
      const finalPath = sessionJsonlPath(target);
      await writeFileWithDirs(finalPath + SESSION_STAGING_SUFFIX, '{"staged":true}\n');
      await installStagedSessionJsonl(target);
      expect(await fs.readFile(finalPath, "utf8")).toBe('{"staged":true}\n');
      await expect(fs.access(finalPath + SESSION_STAGING_SUFFIX)).rejects.toThrow();
    });

    it("discards the staged file when a session file already exists", async () => {
      const target = { claudeSessionId: "keep-live", homeDir: tmpHome };
      const finalPath = sessionJsonlPath(target);
      await writeFileWithDirs(finalPath, '{"live":true}\n');
      await writeFileWithDirs(finalPath + SESSION_STAGING_SUFFIX, '{"staged":true}\n');
      await installStagedSessionJsonl(target);
      expect(await fs.readFile(finalPath, "utf8")).toBe('{"live":true}\n');
      await expect(fs.access(finalPath + SESSION_STAGING_SUFFIX)).rejects.toThrow();
    });

    it("is a no-op when nothing is staged", async () => {
      const target = { claudeSessionId: "nothing", homeDir: tmpHome };
      await installStagedSessionJsonl(target);
      expect(await sessionJsonlExists(target)).toBe(false);
    });
  });
});
