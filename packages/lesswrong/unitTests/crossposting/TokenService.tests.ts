import TokenService from "../../server/fmCrosspost2/TokenService";
import { z } from "zod";

const testPayload = z.object({
  secretValue: z.string(),
});

type TestPayload = z.infer<typeof testPayload>;

describe("TokenService", () => {
  it("can encode and decode valid tokens", async () => {
    const service = new TokenService("test-secret");
    const payload: TestPayload = {secretValue: "12345"};
    const token = await service.encode(payload);
    expect(token.length).toBeGreaterThan(0);
    const decoded = await service.decode(token, testPayload.parse);
    expect(decoded).toStrictEqual(payload);
  });
  it("cannot decode invalid tokens", async () => {
    const service = new TokenService("test-secret");
    const payload = {notATestPayloadProperty: "12345"};
    const token = await service.encode(payload);
    expect(() => service.decode(token, testPayload.parse)).rejects.toThrowError();
  });
  it("Encryption is seeded from the provided secret", async () => {
    const service1 = new TokenService("test-secret-1");
    const service2 = new TokenService("test-secret-2");
    const payload: TestPayload = {secretValue: "12345"};
    const token1 = await service1.encode(payload);
    expect(token1.length).toBeGreaterThan(0);
    const token2 = await service2.encode(payload);
    expect(token2.length).toBeGreaterThan(0);
    expect(token1).not.toBe(token2);
  });
});
