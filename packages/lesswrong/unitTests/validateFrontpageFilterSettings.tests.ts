import { validateFrontpageFilterSettings } from "../server/users/validateFrontpageFilterSettings";

describe('validateFrontpageFilterSettings', () => {
  const makeContext = (results: Array<{ _id: string } | null>) => ({
    loaders: {
      Tags: {
        loadMany: jest.fn(async () => results),
      },
    },
  }) as unknown as ResolverContext;

  it('accepts filter settings when every tag id exists', async () => {
    const filterSettings = {
      personalBlog: "Default",
      tags: [
        { tagId: "aaaaaaaaaaaaaaaaaaaaaaaaaaa", tagName: "Tag", filterMode: "Default" },
      ],
    };

    await expect(
      validateFrontpageFilterSettings(filterSettings, makeContext([{ _id: "aaaaaaaaaaaaaaaaaaaaaaaaaaa" }]))
    ).resolves.toBe(filterSettings);
  });

  it('rejects malformed tag ids before hitting the database', async () => {
    await expect(
      validateFrontpageFilterSettings({
        personalBlog: "Default",
        tags: [{ tagId: 123, tagName: "Tag", filterMode: "Default" }],
      }, makeContext([]))
    ).rejects.toThrow("frontpageFilterSettings.tags[0].tagId must be a non-empty string");
  });

  it('rejects unknown tag ids', async () => {
    await expect(
      validateFrontpageFilterSettings({
        personalBlog: "Default",
        tags: [{ tagId: "missing-tag-id", tagName: "Tag", filterMode: "Default" }],
      }, makeContext([null]))
    ).rejects.toThrow("frontpageFilterSettings contains invalid tagIds: missing-tag-id");
  });
});
