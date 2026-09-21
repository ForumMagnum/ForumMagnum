jest.mock("@/server/emailComponents/AiDigestEmail", () => ({ AiDigestEmail: () => null }));
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockGenerate = jest.fn();
const mockSend = jest.fn();
const mockNotify = jest.fn();
jest.mock("@/server/collections/aiDigestIssues/collection", () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => mockFind(...args),
    findOne: (...args: unknown[]) => mockFindOne(...args),
    rawUpdateOne: (...args: unknown[]) => mockUpdate(...args),
  },
}));
jest.mock("@/server/aiDigest/aiDigestPostSelection", () => ({ generateAiDigestPostSelection: (...args: unknown[]) => mockGenerate(...args) }));
jest.mock("@/server/emails/renderEmail", () => ({ wrapAndSendEmail: (...args: unknown[]) => mockSend(...args) }));
jest.mock("@/server/notificationCallbacksHelpers", () => ({ createNotification: (...args: unknown[]) => mockNotify(...args) }));
jest.mock("@/server/curationEmails/cron", () => ({ findUsersToEmail: async () => [{ _id: "reader" }] }));
jest.mock("@/server/vulcan-lib/apollo-server/context", () => ({ computeContextFromUser: () => ({}) }));
jest.mock("@/server/databaseSettings", () => ({
  aiDigestScheduledEmailsEnabledSetting: { get: () => true },
  aiDigestEmailCadenceDaysSetting: { get: () => 2 },
}));
jest.mock("@/lib/sentryWrapper", () => ({ captureException: jest.fn() }));
import { sendScheduledAiDigestEmails } from "@/server/aiDigest/aiDigestScheduledEmails";

const spec = { subject: "Digest", aiNote: { paragraphs: [] } };
describe("scheduled digest delivery retry", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFind.mockReturnValue({ fetch: async () => [] });
    mockFindOne.mockResolvedValue(null);
    mockGenerate.mockResolvedValue({ issueId: "issue", spec });
    mockSend.mockResolvedValue(true);
  });

  it("retries the saved issue after sending fails, then respects the successful send time", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      mockSend.mockResolvedValueOnce(false);
      await sendScheduledAiDigestEmails();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockNotify).not.toHaveBeenCalled();
      mockFindOne.mockResolvedValue({ _id: "issue", spec, emailedAt: null });
      await sendScheduledAiDigestEmails();
      expect(mockGenerate).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[1][0].tracking.campaignId).toBe("issue");
      expect(mockUpdate).toHaveBeenCalledWith({ _id: "issue" }, { $set: { emailedAt: expect.any(Date) } });
      mockFind.mockReturnValue({ fetch: async () => [{ recipientId: "reader", emailedAt: new Date() }] });
      await sendScheduledAiDigestEmails();
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockFind).toHaveBeenLastCalledWith(
        expect.objectContaining({ emailedAt: { $gt: expect.any(Date) } }),
        expect.anything(), expect.anything(),
      );
    } finally {
      log.mockRestore();
    }
  });

  it("generates a new issue when the previous scheduled issue was sent", async () => {
    mockFindOne.mockResolvedValue({ _id: "old", spec, emailedAt: new Date(0) });
    await sendScheduledAiDigestEmails();
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].tracking.campaignId).toBe("issue");
  });
});
