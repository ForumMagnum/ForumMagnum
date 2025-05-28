import "./integrationTestSetup";
import { createDummyPost } from "./utils";
import { fetchFragmentSingle } from "@/server/fetchFragment";
import { PostsMinimumInfo, PostsListBase, PostsDetails } from "@/lib/collections/posts/fragments";

describe("fetchFragment", () => {
  it("fetches the entire DB object", async () => {
    const post = await createDummyPost();
    const fetched = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentDoc: PostsMinimumInfo,
      currentUser: null,
      selector: post._id,
    });
    expect(fetched).not.toBeNull();
    expect(fetched!._id).toBe(post._id);
    // baseScore is on the DB object, but not in PostsMinimumInfo
    expect(fetched!.baseScore).toBe(1);
  });
  it("fetches SQL resolver fields", async () => {
    const post = await createDummyPost();
    const fetched = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentDoc: PostsListBase,
      currentUser: null,
      selector: post._id,
    });
    expect(fetched).not.toBeNull();
    expect(fetched!._id).toBe(post._id);
    // readTimeMinutes is a SQL resolver field included in PostsListBase
    expect(fetched!.readTimeMinutes).toBe(1);
  });
  it("fetches code resolver fields", async () => {
    const post = await createDummyPost();
    const fetched = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentDoc: PostsDetails,
      currentUser: null,
      selector: post._id,
    });
    expect(fetched).not.toBeNull();
    expect(fetched!._id).toBe(post._id);
    // sourcePostRelations is a code resolver field included in PostsDetails
    expect(fetched!.sourcePostRelations).toStrictEqual([]);
  });
  it("excludes resolver-only fields missing from the fragment", async () => {
    const post = await createDummyPost();
    const fetched = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentDoc: PostsMinimumInfo,
      currentUser: null,
      selector: post._id,
    });
    expect(fetched).not.toBeNull();
    expect(fetched!._id).toBe(post._id);
    // sourcePostRelations is a code resolver field not included in PostsMinimumInfo
    expect((fetched as any).sourcePostRelations).toBeUndefined();
  });
  it("permissions filter out forbidden fields", async () => {
    const post = await createDummyPost();

    const fetchedFiltered = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentDoc: PostsMinimumInfo,
      currentUser: null,
      selector: post._id,
    });
    expect(fetchedFiltered).not.toBeNull();
    expect(fetchedFiltered!._id).toBe(post._id);
    // clickCount is an admin-only field so it should be filtered out
    expect(fetchedFiltered!.clickCount).toBeUndefined();

    // Now turn off filtering and we should have the field
    const fetchedUnfiltered = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentDoc: PostsMinimumInfo,
      currentUser: null,
      selector: post._id,
      skipFiltering: true,
    });
    expect(fetchedUnfiltered).not.toBeNull();
    expect(fetchedUnfiltered!._id).toBe(post._id);
    expect(fetchedUnfiltered!.clickCount).toBe(0);
  });
});
