jest.mock("@/server/emailComponents/AiDigestEmail", () => ({ aiDigestEmailBody: () => () => null }));
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockGenerate = jest.fn();
const mockSend = jest.fn();
const mockNotify = jest.fn();
const mockSubscribers = jest.fn();
const mockAcquire = jest.fn();
const mockRenew = jest.fn();
const mockRelease = jest.fn();
jest.mock("@/server/repos/AiDigestScheduleLeaseRepo", () => ({
  __esModule: true,
  default: class {
    tryAcquire = (...args: unknown[]) => mockAcquire(...args);
    renew = (...args: unknown[]) => mockRenew(...args);
    release = (...args: unknown[]) => mockRelease(...args);
  },
}));
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
jest.mock("@/server/curationEmails/cron", () => ({ findUsersToEmail: (...args: unknown[]) => mockSubscribers(...args) }));
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
    mockSubscribers.mockResolvedValue([{ _id: "reader" }]);
    mockFind.mockReturnValue({ fetch: async () => [] });
    mockFindOne.mockResolvedValue(null);
    mockGenerate.mockResolvedValue({ issueId: "issue", spec });
    mockSend.mockResolvedValue(true);
    mockAcquire.mockResolvedValue("owner");
    mockRenew.mockResolvedValue(true);
    mockRelease.mockResolvedValue(undefined);
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
    expect(mockUpdate).toHaveBeenCalledWith({ _id: "issue" }, { $set: { emailedAt: expect.any(Date) } });
  });

  it("preserves cadence for a sent issue excluded from recommendation history", async () => {
    const now = new Date("2026-09-22T12:00:00Z");
    mockFind.mockReturnValue({ fetch: async () => [{
      recipientId: "reader", emailedAt: now, countsTowardHistory: false,
    }] });

    await sendScheduledAiDigestEmails(now);

    // The delivery query must still retrieve this issue after history clearing;
    // recommendation participation is deliberately absent from its selector.
    expect(mockFind.mock.calls[0][0]).toEqual({
      recipientId: { $in: ["reader"] },
      trigger: "scheduled",
      emailedAt: { $gt: new Date("2026-09-20T14:00:00Z") },
    });
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });
});


describe("scheduled digest batch ownership", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockSubscribers.mockResolvedValue([{ _id: "reader" }]);
    mockAcquire.mockResolvedValue("owner");
    mockRenew.mockResolvedValue(true);
    mockRelease.mockResolvedValue(undefined);
    mockFind.mockReturnValue({ fetch: async () => [] });
    mockFindOne.mockResolvedValue(null);
    mockSend.mockResolvedValue(true);
  });

  it("skips overlapping jobs before even loading subscribers/history", async () => {
    let finishGeneration!: (result: { issueId: string; spec: typeof spec }) => void;
    const generation = new Promise<{ issueId: string; spec: typeof spec }>((resolve) => { finishGeneration = resolve; });
    let generationStarted!: () => void;
    const started = new Promise<void>((resolve) => { generationStarted = resolve; });
    mockGenerate.mockImplementation(() => { generationStarted(); return generation; });
    mockAcquire.mockResolvedValueOnce("owner").mockResolvedValue(null);
    const firstRun = sendScheduledAiDigestEmails();
    await started;
    await sendScheduledAiDigestEmails();
    expect(mockSubscribers).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockRelease).not.toHaveBeenCalled();
    finishGeneration({ issueId: "issue", spec });
    await firstRun;
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalledWith("owner");
  });

  it("releases ownership when loading history fails", async () => {
    mockFind.mockReturnValue({ fetch: async () => { throw new Error("database unavailable"); } });
    await expect(sendScheduledAiDigestEmails()).rejects.toThrow("database unavailable");
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalledWith("owner");
  });

  it("does not generate when ownership expires before the first reader", async () => {
    mockRenew.mockResolvedValue(false);
    await expect(sendScheduledAiDigestEmails()).rejects.toThrow("lease expired or was lost");
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalledWith("owner");
  });

  it.each([false, new Error("database unavailable")])("does not send when the post-generation ownership check fails (%s)", async (failure) => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      mockGenerate.mockResolvedValue({ issueId: "issue", spec });
      mockRenew.mockResolvedValueOnce(true);
      if (failure instanceof Error) mockRenew.mockRejectedValueOnce(failure);
      else mockRenew.mockResolvedValueOnce(failure);
      await sendScheduledAiDigestEmails();
      expect(mockGenerate).toHaveBeenCalledTimes(1);
      expect(mockSend).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockNotify).not.toHaveBeenCalled();
      expect(mockRelease).toHaveBeenCalledWith("owner");

      // Generation persisted the issue before ownership was lost. The next
      // owner can send it without spending another generation or losing cadence.
      mockFindOne.mockResolvedValue({ _id: "issue", spec, emailedAt: null });
      await sendScheduledAiDigestEmails();
      expect(mockGenerate).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({ _id: "issue" }, { $set: { emailedAt: expect.any(Date) } });
      mockFind.mockReturnValue({ fetch: async () => [{ recipientId: "reader", emailedAt: new Date() }] });
      await sendScheduledAiDigestEmails();
      expect(mockSend).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });
});


it("keeps the two-reader bound and releases the lease after a recipient fails", async () => {
  jest.resetAllMocks();
  mockSubscribers.mockResolvedValue([{ _id: "first" }, { _id: "second" }, { _id: "third" }]);
  mockAcquire.mockResolvedValue("owner");
  mockRenew.mockResolvedValue(true);
  mockRelease.mockResolvedValue(undefined);
  mockFind.mockReturnValue({ fetch: async () => [] });
  mockFindOne.mockResolvedValue(null);
  mockGenerate.mockRejectedValueOnce(new Error("generation failed"))
    .mockResolvedValueOnce({ issueId: "second-issue", spec });
  mockSend.mockResolvedValue(true);
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await sendScheduledAiDigestEmails();
    expect(mockGenerate.mock.calls.map(([args]) => args.user._id)).toEqual(["first", "second"]);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].user._id).toBe("second");
    expect(mockRelease).toHaveBeenCalledWith("owner");
  } finally {
    log.mockRestore();
  }
});
