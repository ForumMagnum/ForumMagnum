import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  sessionJsonlPath,
  writeBootstrapJsonl,
  readBootstrapJsonl,
} from "../server/research/sandbox/supervisor/sessionBootstrap";

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
    (p as any).should.be.equal("/home/v/.claude/projects/-vercel-sandbox/sess-1.jsonl");
  });

  it("round-trips a plain text turn", async () => {
    const events = [
      { payload: { type: "user", message: { role: "user", content: "hello" } } },
      {
        payload: {
          type: "assistant",
          message: { role: "assistant", content: [{ type: "text", text: "hi back" }] },
        },
      },
    ];
    const result = await writeBootstrapJsonl(
      { claudeSessionId: "abc", homeDir: tmpHome },
      events,
    );
    (result.lineCount as any).should.be.equal(2);
    const round = await readBootstrapJsonl({ claudeSessionId: "abc", homeDir: tmpHome });
    (round.length as any).should.be.equal(2);
    ((round[0] as any).type).should.be.equal("user");
    ((round[1] as any).type).should.be.equal("assistant");
  });

  it("round-trips a tool_use + tool_result turn", async () => {
    const events = [
      { payload: { type: "user", message: { role: "user", content: "list files" } } },
      {
        payload: {
          type: "assistant",
          message: {
            role: "assistant",
            content: [
              {
                type: "tool_use",
                id: "tu_1",
                name: "Bash",
                input: { command: "ls" },
              },
            ],
          },
        },
      },
      {
        payload: {
          type: "user",
          message: {
            role: "user",
            content: [
              { type: "tool_result", tool_use_id: "tu_1", content: "file1\nfile2" },
            ],
          },
        },
      },
      {
        payload: {
          type: "assistant",
          message: {
            role: "assistant",
            content: [{ type: "text", text: "I see two files" }],
          },
        },
      },
    ];
    await writeBootstrapJsonl({ claudeSessionId: "tool-sess", homeDir: tmpHome }, events);
    const round = await readBootstrapJsonl({ claudeSessionId: "tool-sess", homeDir: tmpHome });
    (round.length as any).should.be.equal(4);
    const toolUse = (round[1] as any).message.content[0];
    (toolUse.type as any).should.be.equal("tool_use");
    (toolUse.id as any).should.be.equal("tu_1");
    const toolResult = (round[2] as any).message.content[0];
    (toolResult.type as any).should.be.equal("tool_result");
    (toolResult.tool_use_id as any).should.be.equal("tu_1");
  });

  it("round-trips a sub-agent spawn turn", async () => {
    const events = [
      { payload: { type: "user", message: { role: "user", content: "research X" } } },
      {
        payload: {
          type: "assistant",
          message: {
            role: "assistant",
            content: [
              {
                type: "tool_use",
                id: "tu_2",
                name: "Task",
                input: {
                  subagent_type: "general-purpose",
                  description: "research X",
                  prompt: "find sources for X and summarize",
                },
              },
            ],
          },
        },
      },
      {
        payload: {
          type: "user",
          message: {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: "tu_2",
                content: "sub-agent finished: 3 sources, summary: ...",
              },
            ],
          },
        },
      },
    ];
    await writeBootstrapJsonl({ claudeSessionId: "subagent-sess", homeDir: tmpHome }, events);
    const round = await readBootstrapJsonl({
      claudeSessionId: "subagent-sess",
      homeDir: tmpHome,
    });
    (round.length as any).should.be.equal(3);
    const taskCall = (round[1] as any).message.content[0];
    (taskCall.name as any).should.be.equal("Task");
    (taskCall.input.subagent_type as any).should.be.equal("general-purpose");
  });

  it("creates parent directories on first write", async () => {
    const events = [{ payload: { type: "user", message: { role: "user", content: "x" } } }];
    const target = { claudeSessionId: "fresh", homeDir: tmpHome, cwd: "/some/cwd" };
    const before = await fs
      .stat(path.join(tmpHome, ".claude", "projects", "-some-cwd"))
      .then(() => true)
      .catch(() => false);
    (before as any).should.be.equal(false);
    const result = await writeBootstrapJsonl(target, events);
    const after = await fs.stat(path.dirname(result.filePath));
    (after.isDirectory() as any).should.be.equal(true);
  });

  it("treats a string payload as a raw JSONL line", async () => {
    const verbatim = '{"type":"system","subtype":"init","model":"claude-opus-4-7"}';
    await writeBootstrapJsonl(
      { claudeSessionId: "raw", homeDir: tmpHome },
      [{ payload: verbatim }],
    );
    const text = await fs.readFile(
      sessionJsonlPath({ claudeSessionId: "raw", homeDir: tmpHome }),
      "utf8",
    );
    (text as any).should.be.equal(verbatim + "\n");
  });

  it("overwrites an existing JSONL on re-bootstrap", async () => {
    const target = { claudeSessionId: "ow", homeDir: tmpHome };
    await writeBootstrapJsonl(target, [{ payload: { type: "user", message: { content: "first" } } }]);
    await writeBootstrapJsonl(target, [{ payload: { type: "user", message: { content: "replaced" } } }]);
    const round = await readBootstrapJsonl(target);
    (round.length as any).should.be.equal(1);
    ((round[0] as any).message.content as any).should.be.equal("replaced");
  });
});
