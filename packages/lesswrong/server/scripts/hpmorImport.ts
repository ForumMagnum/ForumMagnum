import fs from 'fs';
import Users from '../../server/collections/users/collection';
import { Posts } from '../../server/collections/posts/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { createPost } from '../collections/posts/mutations';

const hpmorImport = false;

if (hpmorImport) { void (async ()=>{
  let filepath = process.env["PWD"] + "/packages/lesswrong/assets/hpmor_data.json";
  let f = fs.readFileSync(filepath, 'utf8');
  //eslint-disable-next-line no-console
  console.log("Read file");
  try {
    // console.log(f);
    var hpmor_data = JSON.parse(f);
  } catch(err) {
    //eslint-disable-next-line no-console
    console.error(err);
  }

  const eliezerId = "nmk3nLpQE89dMRzzN"

  //eslint-disable-next-line no-console
  console.log(Object.keys(hpmor_data));
  //eslint-disable-next-line no-console
  console.log(hpmor_data.chapters[1]);
  await asyncForeachSequential(Object.keys(hpmor_data.chapters), async (chapterNumber) => {
    var post = {
      title: "HPMOR Chapter: " + chapterNumber,
      userId: eliezerId,
      draft: true,
      contents: {
        originalContents: {
          data: hpmor_data.chapters[chapterNumber],
          type: "html"
        }
      },
    };

    const lwUser = await Users.findOne({_id: eliezerId});
    const oldPost = await Posts.findOne({title: post.title});

    if (!oldPost){
      const lwContext = await computeContextFromUser({ user: lwUser, isSSR: false });
      void createPost({
        data: post
      }, lwContext, true);
    } else {
      //eslint-disable-next-line no-console
      console.log("Post already imported: ", oldPost);
    }
  })
})() }
