import fs from 'fs';
import Users from '../../lib/collections/users/collection';
import { Posts } from '../../lib/collections/posts';
import { newMutation } from '../vulcan-lib';

const hpmorImport = false;

if (hpmorImport) {
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
  Object.keys(hpmor_data.chapters).forEach(chapterNumber => {
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

    const lwUser = Users.findOne({_id: eliezerId});
    const oldPost = Posts.findOne({title: post.title});

    if (!oldPost){
      void newMutation({
        collection: Posts,
        document: post,
        currentUser: lwUser,
        validate: false,
      })
    } else {
      //eslint-disable-next-line no-console
      console.log("Post already imported: ", oldPost);
    }
  })
}
