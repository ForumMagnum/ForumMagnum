const mockAkismetClient = {
  verifyKey: jest.fn(() => new Promise(() => {})),
  checkSpam: jest.fn(),
  submitHam: jest.fn(),
  submitSpam: jest.fn(),
};

jest.mock('akismet-api', () => ({
  __esModule: true,
  default: {
    client: jest.fn(() => mockAkismetClient),
  },
}));

import { akismetKeySetting, akismetURLSetting } from "../server/databaseSettings";
import { maybeFlagUserBioForSpamWithAkismet } from "../server/users/akismetBio";

const spamBioHtml = '<p>Please visit <a href="https://spam.example">my site</a></p>';

function makeBiography(html: string): NonNullable<DbUser["biography"]> {
  return { html } as NonNullable<DbUser["biography"]>;
}

function makeUser(overrides: Partial<DbUser> = {}): DbUser {
  return {
    _id: "user1",
    slug: "user-one",
    displayName: "User One",
    reviewedByUserId: null,
    biography: makeBiography(spamBioHtml),
    sunshineNotes: "",
    ...overrides,
  } as DbUser;
}

function makeContext({loginEvent, latestUser}: {
  loginEvent?: AnyBecauseTodo,
  latestUser?: DbUser|null,
} = {}) {
  const event = loginEvent === undefined
    ? {
      properties: {
        ip: "1.2.3.4",
        userAgent: "test user agent",
        referrer: "https://google.example",
      },
    }
    : loginEvent;
  const fetch = jest.fn().mockResolvedValue(event ? [event] : []);
  const find = jest.fn(() => ({fetch}));
  const findOne = jest.fn().mockResolvedValue(latestUser ?? makeUser());
  const rawUpdateOne = jest.fn().mockResolvedValue(1);

  return {
    context: {
      LWEvents: { find },
      Users: { findOne, rawUpdateOne },
    } as unknown as ResolverContext,
    find,
    fetch,
    findOne,
    rawUpdateOne,
  };
}

describe("maybeFlagUserBioForSpamWithAkismet", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockAkismetClient.checkSpam.mockReset();
    mockAkismetClient.verifyKey.mockClear();
    mockAkismetClient.submitHam.mockClear();
    mockAkismetClient.submitSpam.mockClear();

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(akismetKeySetting, "get").mockReturnValue("akismet-key");
    jest.spyOn(akismetURLSetting, "get").mockReturnValue("https://forum.example");
  });

  it("flags unreviewed users when Akismet marks a changed bio as spam", async () => {
    mockAkismetClient.checkSpam.mockResolvedValue(true);
    const oldUser = makeUser({ biography: makeBiography("") });
    const updatedUser = makeUser();
    const latestUser = makeUser({ sunshineNotes: "Existing note\n" });
    const { context, rawUpdateOne } = makeContext({ latestUser });

    await maybeFlagUserBioForSpamWithAkismet(updatedUser, oldUser, context);

    expect(mockAkismetClient.checkSpam).toHaveBeenCalledWith(expect.objectContaining({
      user_ip: "1.2.3.4",
      user_agent: "test user agent",
      referrer: "https://google.example",
      permalink: "https://forum.example/users/user-one",
      comment_type: "signup",
      comment_author: "User One",
      comment_content: spamBioHtml,
    }));
    const akismetPayload = mockAkismetClient.checkSpam.mock.calls[0][0];
    expect(akismetPayload).not.toHaveProperty("comment_author_email");
    expect(akismetPayload).not.toHaveProperty("comment_author_url");

    expect(rawUpdateOne).toHaveBeenCalledWith({
      _id: "user1",
      reviewedByUserId: null,
      "biography.html": spamBioHtml,
      sunshineNotes: "Existing note\n",
    }, {
      $set: expect.objectContaining({
        needsReview: true,
        sunshineFlagged: true,
        sunshineNotes: expect.stringContaining("Akismet: Profile bio was flagged as possible spam by Akismet. Review bio links before approving.\nExisting note\n"),
      }),
    });
  });

  it("does not flag users when Akismet returns ham", async () => {
    mockAkismetClient.checkSpam.mockResolvedValue(false);
    const oldUser = makeUser({ biography: makeBiography("") });
    const { context, rawUpdateOne } = makeContext();

    await maybeFlagUserBioForSpamWithAkismet(makeUser(), oldUser, context);

    expect(mockAkismetClient.checkSpam).toHaveBeenCalledTimes(1);
    expect(rawUpdateOne).not.toHaveBeenCalled();
  });

  it("does not call Akismet for reviewed users", async () => {
    const oldUser = makeUser({ biography: makeBiography("") });
    const reviewedUser = makeUser({ reviewedByUserId: "mod1" });
    const { context, find, rawUpdateOne } = makeContext();

    await maybeFlagUserBioForSpamWithAkismet(reviewedUser, oldUser, context);

    expect(find).not.toHaveBeenCalled();
    expect(mockAkismetClient.checkSpam).not.toHaveBeenCalled();
    expect(rawUpdateOne).not.toHaveBeenCalled();
  });

  it("does not call Akismet when the bio is unchanged or empty", async () => {
    const unchangedUser = makeUser();
    const emptyBioUser = makeUser({ biography: makeBiography("   ") });
    const { context, find, rawUpdateOne } = makeContext();

    await maybeFlagUserBioForSpamWithAkismet(unchangedUser, makeUser(), context);
    await maybeFlagUserBioForSpamWithAkismet(emptyBioUser, makeUser({ biography: makeBiography("") }), context);

    expect(find).not.toHaveBeenCalled();
    expect(mockAkismetClient.checkSpam).not.toHaveBeenCalled();
    expect(rawUpdateOne).not.toHaveBeenCalled();
  });

  it("does not call Akismet when the Akismet key is missing", async () => {
    jest.spyOn(akismetKeySetting, "get").mockReturnValue(null);
    const oldUser = makeUser({ biography: makeBiography("") });
    const { context, find, rawUpdateOne } = makeContext();

    await maybeFlagUserBioForSpamWithAkismet(makeUser(), oldUser, context);

    expect(find).not.toHaveBeenCalled();
    expect(mockAkismetClient.checkSpam).not.toHaveBeenCalled();
    expect(rawUpdateOne).not.toHaveBeenCalled();
  });

  it("does not call Akismet when no login IP is available", async () => {
    const oldUser = makeUser({ biography: makeBiography("") });
    const { context, rawUpdateOne } = makeContext({ loginEvent: null });

    await maybeFlagUserBioForSpamWithAkismet(makeUser(), oldUser, context);

    expect(mockAkismetClient.checkSpam).not.toHaveBeenCalled();
    expect(rawUpdateOne).not.toHaveBeenCalled();
  });

  it("fails open when Akismet throws", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockAkismetClient.checkSpam.mockRejectedValue(new Error("Akismet unavailable"));
    const oldUser = makeUser({ biography: makeBiography("") });
    const { context, rawUpdateOne } = makeContext();

    await maybeFlagUserBioForSpamWithAkismet(makeUser(), oldUser, context);

    expect(mockAkismetClient.checkSpam).toHaveBeenCalledTimes(1);
    expect(rawUpdateOne).not.toHaveBeenCalled();
  });
});
