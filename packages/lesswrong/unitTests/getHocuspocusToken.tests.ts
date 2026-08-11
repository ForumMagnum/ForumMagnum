import { GraphQLError } from "graphql";

const mockRunQueryNonThrowing = jest.fn();

jest.mock("@/server/vulcan-lib/query", () => ({
  runQueryNonThrowing: (...args: unknown[]) => mockRunQueryNonThrowing(...args),
}));

import { getHocuspocusTokenForCollection } from "../../../app/api/agent/getHocuspocusToken";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

describe("getHocuspocusTokenForCollection", () => {
  const context = createAnonymousContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a token from a successful auth query", async () => {
    mockRunQueryNonThrowing.mockResolvedValue({
      data: { HocuspocusAuth: { token: "test-token" } },
    });

    await expect(
      getHocuspocusTokenForCollection(context, "Posts", "post-id", "sharing-key")
    ).resolves.toBe("test-token");
  });

  it("returns null when collaborative editor access is unauthorized", async () => {
    mockRunQueryNonThrowing.mockResolvedValue({
      data: { HocuspocusAuth: null },
      errors: [new GraphQLError("Unauthorized: You do not have access to collaborate on this post")],
    });

    await expect(
      getHocuspocusTokenForCollection(context, "Posts", "post-id", "wrong-key")
    ).resolves.toBeNull();
  });

  it("preserves unexpected authentication failures", async () => {
    mockRunQueryNonThrowing.mockResolvedValue({
      data: { HocuspocusAuth: null },
      errors: [new GraphQLError("Hocuspocus signing secret is unavailable")],
    });

    await expect(
      getHocuspocusTokenForCollection(context, "Posts", "post-id", "sharing-key")
    ).rejects.toThrow("Hocuspocus signing secret is unavailable");
  });
});
