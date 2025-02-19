/* eslint-disable no-console */
import { getLatestContentsRevision } from "@/lib/collections/revisions/helpers";
import { getPostDescription } from "../../components/posts/PostsPage/PostsPage";
import { Posts } from "../../lib/collections/posts";
import Revisions from "../../lib/collections/revisions/collection";
import { Vulcan } from "../vulcan-lib";


/** For visually inspecting that our descriptions match the post content well */
const run = async () => {
  const plaintextResolver = Revisions._schemaFields.plaintextDescription.resolveAs?.resolver
  console.log("running");
  console.log('plaintextResolver', plaintextResolver);
  if (!plaintextResolver) throw new Error('no plaintextResolver');
  const posts: DbPost[] = await Posts.aggregate([
    {$match: { baseScore: { $gte: 1 } }},
    {$sample: {size: 20}}
  ]).toArray();

  const revisions = await Promise.all(
    posts.map((post) => getLatestContentsRevision(post)),
  );

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const rev = revisions[i];
    if (!rev) continue;
    const plaintextDescription = plaintextResolver(rev, {}, {} as any)
    const fakeDoc = {
      contents: {
        plaintextDescription
      }
    }
    const description = getPostDescription(fakeDoc as any);
    console.log(`# ${post.title}`)
    console.log(plaintextDescription);
    console.log(`. . . . . . . . . . .`);
    console.log(description);
    console.log(`\n\n`);
  }
};

Vulcan.testPostDescription = run;
