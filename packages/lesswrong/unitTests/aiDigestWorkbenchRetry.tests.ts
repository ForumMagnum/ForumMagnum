const mockGenerate = jest.fn();
const mockFindUser = jest.fn();
const mockContext = jest.fn();
jest.mock("@/server/aiDigest/aiDigestPostSelection", () => ({ generateAiDigestPostSelection: (...args: unknown[]) => mockGenerate(...args) }));
jest.mock("@/server/aiDigest/aiDigestHistory", () => ({ clearAiDigestRecommendationHistory: jest.fn() }));
jest.mock("@/server/collections/users/collection", () => ({ __esModule: true, default: { findOne: (...args: unknown[]) => mockFindUser(...args) } }));
jest.mock("@/server/collections/aiDigestIssues/collection", () => ({ __esModule: true, default: {} }));
jest.mock("@/server/emailComponents/AiDigestEmail", () => ({ AiDigestEmail: () => null }));
jest.mock("@/server/emails/renderEmail", () => ({ wrapAndRenderEmail: jest.fn() }));
jest.mock("@/lib/collections/users/helpers", () => ({ getUserEmail: jest.fn() }));
jest.mock("@/server/vulcan-lib/apollo-server/context", () => ({ computeContextFromUser: () => mockContext() }));

import { digestEmailPreviewGraphQLMutations } from "@/server/resolvers/digestEmailPreviewResolver";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

describe("digest workbench generation", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockContext.mockReturnValue({ currentUser: { _id: "admin", isAdmin: true } });
    mockFindUser.mockResolvedValue({ _id: "reader", slug: "reader" });
  });

  it("propagates a failed generation without repeating the whole pipeline", async () => {
    const failure = new Error("provider unavailable");
    mockGenerate.mockRejectedValue(failure);
    await expect(digestEmailPreviewGraphQLMutations.GenerateAiDigestEmailSamples(
      undefined, { userSlug: "reader", count: 1 }, computeContextFromUser({ user: null, isSSR: false }),
    )).rejects.toBe(failure);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("returns each requested saved sample and preserves the history preference", async () => {
    mockGenerate.mockResolvedValueOnce({ issueId: "first" }).mockResolvedValueOnce({ issueId: "second" });
    await expect(digestEmailPreviewGraphQLMutations.GenerateAiDigestEmailSamples(
      undefined, { userSlug: "reader", count: 2, countsTowardHistory: false }, computeContextFromUser({ user: null, isSSR: false }),
    )).resolves.toEqual(["first", "second"]);
    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({ options: { countsTowardHistory: false } }));
  });

  it.each([null, { _id: "reader", isAdmin: false }])("rejects non-admin access before generation (%s)", async (currentUser) => {
    mockContext.mockReturnValue({ currentUser });
    await expect(digestEmailPreviewGraphQLMutations.GenerateAiDigestEmailSamples(
      undefined, { userSlug: "reader", count: 1 }, computeContextFromUser({ user: null, isSSR: false }),
    )).rejects.toThrow("only available to admin");
    expect(mockFindUser).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
