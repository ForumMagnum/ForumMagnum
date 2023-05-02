import { Posts } from '../../lib/collections/posts';
import { runQuery } from '../vulcan-lib';
import { onStartup } from '../../lib/executionEnvironment';

let runSSCFix = false;

if (runSSCFix) {
  onStartup(function () {
    async function completeCodex() {
      const query = `
      query CodexComplete {
        CollectionsSingle(documentId:"2izXHCrmJ684AnZ5X") {
          _id
          createdAt
          userId
          title
          contents {
            html
          }
          gridImageId
          firstPageLink
          books {
            title
            posts {
              _id
              title
            }
            sequences {
              title
              chapters {
                title
                posts {
                  _id
                  title
                }
              }
            }
          }
        }
      }`;
      return await runQuery(query);
    }

    async function allCodexPosts() {
      let queryResult: any = await completeCodex();
      //eslint-disable-next-line no-console
      console.log(queryResult);

      let allCodexPosts: AnyBecauseTodo[] = [];

      queryResult.data.CollectionsSingle.books.forEach((book: AnyBecauseTodo) => {
        //eslint-disable-next-line no-console
        console.log("Adding posts for book...")
        allCodexPosts = allCodexPosts.concat(book.posts);
        book.sequences.forEach((sequence: AnyBecauseTodo) => {
          sequence.chapters.forEach((chapter: AnyBecauseTodo) => {
            //eslint-disable-next-line no-console
            console.log("Adding Posts for chapter...")
            allCodexPosts = allCodexPosts.concat(chapter.posts);
          })
        })
      })
      return allCodexPosts;
    }

    async function updateCodexDrafts() {
      let allCodexPostIds: any = await allCodexPosts();
      allCodexPostIds = allCodexPostIds.map((post: AnyBecauseTodo) => post._id);
      //eslint-disable-next-line no-console
      console.log(allCodexPostIds)
      await Posts.rawUpdateMany({_id: {$in: allCodexPostIds}}, {$set: {draft: false}}, {multi: true})
      //eslint-disable-next-line no-console
      console.log("Updated codex draft status");
    }

    void updateCodexDrafts()
  });

}
