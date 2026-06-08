import {
  AGENT_CWD,
  AGENT_HOME_DIR,
  PLATFORM_DIR,
  SANDBOX_HOME_DIR,
} from "../server/research/sandbox/sandboxLayout";
import {
  buildScriptBootEnv,
  researchBinPath,
} from "../server/research/sandbox/supervisor/devServer";
import { sessionJsonlPath } from "../server/research/sandbox/supervisor/sessionBootstrap";

describe("research sandbox home layout", () => {
  const originalPath = process.env.PATH;

  beforeEach(() => {
    process.env.PATH = "/usr/bin";
  });

  afterEach(() => {
    process.env.PATH = originalPath;
  });

  it("keeps platform files outside the agent cwd", () => {
    expect(SANDBOX_HOME_DIR).toBe("/root");
    expect(PLATFORM_DIR).toBe("/root/.research");
    expect(AGENT_CWD).toBe("/vercel/sandbox");
    expect(AGENT_HOME_DIR).toBe("/vercel/sandbox/.home");
  });

  it("runs agent boot scripts with a writable home and platform tools on PATH", () => {
    const env = buildScriptBootEnv();

    expect(env.HOME).toBe(AGENT_HOME_DIR);
    expect(env.PATH).toBe("/root/.research/bin:/usr/bin");
    expect(researchBinPath()).toBe("/root/.research/bin:/usr/bin");
  });

  it("writes Claude resume history under the agent home", () => {
    const sessionPath = sessionJsonlPath({
      claudeSessionId: "session-1",
      cwd: AGENT_CWD,
      homeDir: AGENT_HOME_DIR,
    });

    expect(sessionPath).toBe(
      "/vercel/sandbox/.home/.claude/projects/-vercel-sandbox/session-1.jsonl",
    );
  });
});
