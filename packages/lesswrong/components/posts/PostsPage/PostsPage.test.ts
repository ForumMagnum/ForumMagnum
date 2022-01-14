// import { renderHook, act } from "@testing-library/react-hooks";
// import { Posts } from "../../../lib/collections/posts";
// import { useSingle } from "../../../lib/crud/withSingle";
// import { testStartup } from "../../../testing/testMain";
// import { getPostDescription } from "./PostsPage";

// testStartup();
// describe("getPostDescription", () => {
//   it("runs an end-to-end test", async () => {
//     console.log("running");
//     const postsCursor = await Posts.find({ baseScore: { $gte: 1 } }, undefined, { _id: 1 }).fetch();
//     console.log(postsCursor);
//     for (const doc of postsCursor) {
//       console.log("doc", doc);
//       const { result } = renderHook(() =>
//         useSingle({ collectionName: "Posts", documentId: doc._id, fragmentName: "PostsWithNavigation" })
//       );
//       console.log(result);
//       // const description = getPostDescription(post);
//       // const plaintextDescription = post.contents.plaintextDescription;
//       // console.log(plaintextDescription);
//       // console.log(`. . . . . . . . . . .`);
//       // console.log(description);
//       // console.log(`\n\n`);
//       break;
//     }
//   });
// });
