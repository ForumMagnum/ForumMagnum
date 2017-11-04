import { Books } from "./collection";
import { Posts } from "meteor/example-forum";
import { addCallback, editMutation, runCallbacksAsync, runQuery } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';

function BooksNewHTMLSerializeCallback (book) {
  if (book.description) {
    const contentState = convertFromRaw(book.description);
    const html = draftToHTML(contentState);
    book.htmlDescription = html;
    book.plaintextDescription = contentState.getPlainText();
  }
  return book
}

addCallback("books.new.sync", BooksNewHTMLSerializeCallback);

function BooksEditHTMLSerializeCallback (modifier, book) {
  if (modifier.$set && modifier.$set.description) {
    const contentState = convertFromRaw(modifier.$set.description);
    modifier.$set.htmlDescription = draftToHTML(contentState);
    modifier.$set.plaintextDescription = contentState.getPlainText();
  } else if (modifier.$set && modifier.$set.htmlDescription) {
    modifier.$set.plaintextDescription = htmlToText.fromString(modifier.$set.htmlDescription);
  } else if (modifier.$unset && modifier.$unset.description) {
    modifier.$unset.htmlDescription = true;
    modifier.$unset.plaintextDescription = true;
  }
  return modifier
}

addCallback("books.edit.sync", BooksEditHTMLSerializeCallback);



async function getCompleteCollection(id) {
  const query = `
  query CodexComplete {
    CollectionsSingle(documentId:"${id}") {
      _id
      slug
      books {
        _id
        posts {
          slug
          canonicalCollectionSlug
          canonicalPrevPostSlug
          canonicalNextPostSlug
        }
        sequences {
          title
          chapters {
            posts {
              slug
              canonicalCollectionSlug
              canonicalPrevPostSlug
              canonicalNextPostSlug
            }
          }
        }
      }
    }
  }`;
  const result = await runQuery(query)
  return result
}

async function getAllCollectionPosts(id) {
  let queryResult = await getCompleteCollection(id);

  let allCollectionPosts = [];

  const collection = queryResult.data.CollectionsSingle

  collection.books.forEach((book) => {
    const bookPosts = book.posts.map((post) => {
      post.canonicalBookId = book._id
      return post
    })
    allCollectionPosts = allCollectionPosts.concat(bookPosts);

    book.sequences.forEach((sequence) => {
      sequence.chapters.forEach((chapter) => {
        const newPosts = chapter.posts.map((post) => {
          post.canonicalBookId = book._id
          return post
        })
        allCollectionPosts = allCollectionPosts.concat(newPosts);
      })
    })
  })
  return {
    posts: allCollectionPosts,
    collectionSlug: collection.slug,
  }
}

async function UpdateCollectionLinks (book) {
  const collectionId = book.collectionId
  const results = await getAllCollectionPosts(collectionId)
  console.log(`Updating Collection Links for ${collectionId}...`)
  _.range(results.posts.length).forEach((i) => {
    const currentPost = results.posts[i]
    if (i==0) {
      Collections.update(collectionId, { $set: {
        firstPageLink: "/" + results.collectionSlug + "/" + currentPost.slug
      }})
    }

    let prevPost = {slug:""}
    let nextPost = {slug:""}
    if (i-1>=0) {
      prevPost = results.posts[i-1]
    }
    if (i+1<results.posts.length) {
      nextPost = results.posts[i+1]
    }
    Posts.update({slug: currentPost.slug}, {$set: {
      canonicalPrevPostSlug: prevPost.slug,
      canonicalNextPostSlug: nextPost.slug,
      canonicalBookId: currentPost.canonicalBookId,
      canonicalCollectionSlug: results.collectionSlug,
    }});
    const newPost = Posts.findOne({slug:currentPost.slug})
  })
  console.log(`...finished Updating Collection Links for ${collectionId}`)
}
addCallback("books.edit.async", UpdateCollectionLinks);
