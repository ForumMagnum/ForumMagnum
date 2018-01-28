import { Posts } from 'meteor/example-forum';
import { runQuery } from 'meteor/vulcan:core';

let runSSCFix = false;

if (runSSCFix) {
  Meteor.startup(function () {
    async function completeCodex() {
      const query = `
      query CodexComplete {
        CollectionsSingle(documentId:"2izXHCrmJ684AnZ5X") {
          _id
          createdAt
          userId
          title
          description
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
      let queryResult = await completeCodex();
      console.log(queryResult);

      let allCodexPosts = [];

      queryResult.data.CollectionsSingle.books.forEach((book) => {
        console.log("Adding posts for book...")
        allCodexPosts = allCodexPosts.concat(book.posts);
        book.sequences.forEach((sequence) => {
          sequence.chapters.forEach((chapter) => {
            console.log("Adding Posts for chapter...")
            allCodexPosts = allCodexPosts.concat(chapter.posts);
          })
        })
      })
      return allCodexPosts;
    }

    async function updateCodexDrafts() {
      let allCodexPostIds = await allCodexPosts();
      allCodexPostIds = allCodexPostIds.map((post) => post._id);
      console.log(allCodexPostIds)
      Posts.update({_id: {$in: allCodexPostIds}}, {$set: {draft: false}}, {multi: true})
      console.log("Updated codex draft status");
    }

    updateCodexDrafts()
  });

}
