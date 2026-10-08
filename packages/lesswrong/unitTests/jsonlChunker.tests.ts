import { createJsonlChunker } from "../server/research/sandbox/supervisor/jsonlParser";

describe("jsonl chunker", () => {
  it("splits whole lines as they arrive", () => {
    const c = createJsonlChunker();
    const out = c.push('{"type":"user","session_id":"s1"}\n{"type":"assistant","session_id":"s1"}\n');
    (out.length as any).should.be.equal(2);
    (out[0].kind as any).should.be.equal("user");
    (out[1].kind as any).should.be.equal("assistant");
    (out[0].sessionId as any).should.be.equal("s1");
  });

  it("accumulates partial chunks until newline", () => {
    const c = createJsonlChunker();
    (c.push('{"type":"user"').length as any).should.be.equal(0);
    (c.push(',"foo":1}\n').length as any).should.be.equal(1);
  });

  it("preserves verbatim raw line text", () => {
    const c = createJsonlChunker();
    const raw = '{"type":"assistant","extra":"  spaced  ","unicode":"日本"}';
    const out = c.push(raw + "\n");
    (out[0].raw as any).should.be.equal(raw);
  });

  it("handles unparseable lines without throwing", () => {
    const c = createJsonlChunker();
    const out = c.push("not-json\n");
    (out.length as any).should.be.equal(1);
    (out[0].raw as any).should.be.equal("not-json");
    (out[0].parsed === null).should.be.equal(true);
    (out[0].kind as any).should.be.equal("unknown");
  });

  it("flushes a final partial line as raw + unparseable", () => {
    const c = createJsonlChunker();
    (c.push('{"type":"user"').length as any).should.be.equal(0);
    const flushed = c.flush();
    (flushed.length as any).should.be.equal(1);
    (flushed[0].raw as any).should.be.equal('{"type":"user"');
    (flushed[0].parsed === null).should.be.equal(true);
  });

  it("flush returns nothing when no pending text", () => {
    const c = createJsonlChunker();
    const flushed = c.flush();
    (flushed.length as any).should.be.equal(0);
  });

  it("flushes a final non-newline-terminated complete line", () => {
    const c = createJsonlChunker();
    (c.push('{"type":"user","session_id":"abc"}').length as any).should.be.equal(0);
    const flushed = c.flush();
    (flushed.length as any).should.be.equal(1);
    (flushed[0].kind as any).should.be.equal("user");
  });

  it("extracts uuid from message.id when present", () => {
    const c = createJsonlChunker();
    const out = c.push('{"type":"assistant","message":{"id":"msg_01abc"}}\n');
    (out[0].claudeMessageUuid as any).should.be.equal("msg_01abc");
  });

  it("ignores empty lines between events", () => {
    const c = createJsonlChunker();
    const out = c.push('{"type":"user"}\n\n{"type":"assistant"}\n');
    (out.length as any).should.be.equal(2);
  });
});
