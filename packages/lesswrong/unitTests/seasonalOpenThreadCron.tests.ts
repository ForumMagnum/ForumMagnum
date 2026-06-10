const mockPostsFindOne = jest.fn();
const mockPostsFind = jest.fn();
const mockUsersFindOne = jest.fn();
const mockCreatePost = jest.fn();
const mockUpdatePost = jest.fn();
const mockComputeContextFromUser = jest.fn();
const mockGetLockOrAbort = jest.fn();
const mockOpenThreadTagIdGet = jest.fn();
const mockAuthorSlugGet = jest.fn();
const mockIsLW = jest.fn();

jest.mock("@/server/collections/posts/collection", () => ({
  __esModule: true,
  default: {
    findOne: (...args: unknown[]) => mockPostsFindOne(...args),
    find: (...args: unknown[]) => mockPostsFind(...args),
  },
}));

jest.mock("@/server/collections/users/collection", () => ({
  __esModule: true,
  default: {
    findOne: (...args: unknown[]) => mockUsersFindOne(...args),
  },
}));

jest.mock("@/server/collections/posts/mutations", () => ({
  createPost: (...args: unknown[]) => mockCreatePost(...args),
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
}));

jest.mock("@/server/vulcan-lib/apollo-server/context", () => ({
  computeContextFromUser: (...args: unknown[]) => mockComputeContextFromUser(...args),
}));

jest.mock("@/server/utils/advisoryLockUtil", () => ({
  getLockOrAbort: (...args: unknown[]) => mockGetLockOrAbort(...args),
}));

jest.mock("@/lib/instanceSettings", () => ({
  openThreadTagIdSetting: {
    get: (...args: unknown[]) => mockOpenThreadTagIdGet(...args),
  },
  seasonalOpenThreadAuthorSlugSetting: {
    get: (...args: unknown[]) => mockAuthorSlugGet(...args),
  },
  isLW: (...args: unknown[]) => mockIsLW(...args),
}));

import { maybeCreateSeasonalOpenThread } from "@/server/posts/seasonalOpenThreadCron";

const makeFindResult = (posts: Array<{ _id: string }>) => ({
  fetch: jest.fn().mockResolvedValue(posts),
});

describe("seasonal open thread cron", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenThreadTagIdGet.mockReturnValue("openThreadTagId");
    mockAuthorSlugGet.mockReturnValue("habryka4");
    mockIsLW.mockReturnValue(true);
    mockUsersFindOne.mockResolvedValue({ _id: "habrykaUserId", slug: "habryka4" });
    mockComputeContextFromUser.mockResolvedValue({ currentUser: { _id: "habrykaUserId" } });
    mockGetLockOrAbort.mockImplementation(async (_lockName: string, callback: (task: unknown) => Promise<void>) => {
      await callback({});
    });
    mockPostsFindOne.mockResolvedValue(null);
    mockPostsFind.mockReturnValue(makeFindResult([{ _id: "oldOpenThreadId" }]));
    mockCreatePost.mockResolvedValue({ _id: "newOpenThreadId" });
    mockUpdatePost.mockResolvedValue({ _id: "oldOpenThreadId", sticky: false });
  });

  it("creates and pins a seasonal open thread, then unpins the previous one", async () => {
    const result = await maybeCreateSeasonalOpenThread(new Date(Date.UTC(2026, 5, 1)));

    expect(result).toEqual({
      status: "created",
      title: "Open Thread Summer 2026",
      postId: "newOpenThreadId",
      unpinnedPostIds: ["oldOpenThreadId"],
    });
    expect(mockUsersFindOne).toHaveBeenCalledWith({ slug: "habryka4" });
    expect(mockCreatePost).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Open Thread Summer 2026",
        draft: false,
        sticky: true,
        stickyPriority: 2,
        submitToFrontpage: false,
        tagRelevance: {
          openThreadTagId: 1,
        },
        contents: {
          originalContents: expect.objectContaining({
            type: "markdown",
          }),
        },
      }),
    }, { currentUser: { _id: "habrykaUserId" } });
    expect(mockUpdatePost).toHaveBeenCalledWith({
      selector: { _id: "oldOpenThreadId" },
      data: { sticky: false },
    }, { currentUser: { _id: "habrykaUserId" } });
  });

  it("does not duplicate an existing seasonal open thread", async () => {
    mockPostsFindOne.mockResolvedValue({ _id: "existingOpenThreadId" });
    mockPostsFind.mockReturnValue(makeFindResult([{ _id: "existingOpenThreadId" }, { _id: "oldOpenThreadId" }]));

    const result = await maybeCreateSeasonalOpenThread(new Date(Date.UTC(2026, 11, 1)));

    expect(result).toEqual({
      status: "already_exists",
      title: "Open Thread Winter 2026/27",
      postId: "existingOpenThreadId",
      unpinnedPostIds: ["oldOpenThreadId"],
    });
    expect(mockCreatePost).not.toHaveBeenCalled();
    expect(mockUpdatePost).toHaveBeenCalledTimes(1);
  });

  it("does nothing on non-scheduled days", async () => {
    const result = await maybeCreateSeasonalOpenThread(new Date(Date.UTC(2026, 5, 5)));

    expect(result).toEqual({ status: "not_due" });
    expect(mockGetLockOrAbort).not.toHaveBeenCalled();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });
});
