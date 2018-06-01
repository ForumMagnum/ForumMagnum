import Collections from "../collections/collection";
import Sequences from "../sequences/collection";
import { Posts } from "meteor/example-forum";
import { addCallback, runQuery } from 'meteor/vulcan:core';
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
          _id
          title
          chapters {
            number
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
  let allCollectionSequences = [];

  const collection = queryResult.data.CollectionsSingle

  collection.books.forEach((book) => {
    const bookPosts = book.posts.map((post) => {
      post.canonicalBookId = book._id
      return post
    })
    allCollectionPosts = allCollectionPosts.concat(bookPosts);
    allCollectionSequences = allCollectionSequences.concat(book.sequences);
    book.sequences.forEach((sequence) => {
      sequence.chapters.forEach((chapter) => {
        const newPosts = chapter.posts.map((post) => {
          post.canonicalBookId = book._id
          post.canonicalSequenceId = sequence._id
          return post
        })
        allCollectionPosts = allCollectionPosts.concat(newPosts);
      })
    })
  })
  return {
    posts: allCollectionPosts,
    sequences: allCollectionSequences,
    collectionSlug: collection.slug,
  }
}

function updateCollectionSequences(sequences, collectionSlug) {
  _.range(sequences.length).forEach((i) => {
    Sequences.update(sequences[i]._id, {$set: {
      canonicalCollectionSlug: collectionSlug,
    }});
  })
}

function updateCollectionPosts(posts, collectionSlug) {
  _.range(posts.length).forEach((i) => {
    const currentPost = posts[i]

    let prevPost = {slug:""}
    let nextPost = {slug:""}
    if (i-1>=0) {
      prevPost = posts[i-1]
    }
    if (i+1<posts.length) {
      nextPost = posts[i+1]
    }
    Posts.update({slug: currentPost.slug}, {$set: {
      canonicalPrevPostSlug: prevPost.slug,
      canonicalNextPostSlug: nextPost.slug,
      canonicalBookId: currentPost.canonicalBookId,
      canonicalCollectionSlug: collectionSlug,
      canonicalSequenceId: currentPost.canonicalSequenceId,
    }});
  })
}

async function UpdateCollectionLinks (book) {
  const collectionId = book.collectionId
  const results = await getAllCollectionPosts(collectionId)

  //eslint-disable-next-line no-console
  console.log(`Updating Collection Links for ${collectionId}...`)

  Collections.update(collectionId, { $set: {
    firstPageLink: "/" + results.collectionSlug + "/" + results.posts[0].slug
  }})

  updateCollectionSequences(results.sequences, results.collectionSlug)
  updateCollectionPosts(results.posts, results.collectionSlug)

  //eslint-disable-next-line no-console
  console.log(`...finished Updating Collection Links for ${collectionId}`)
}
addCallback("books.edit.async", UpdateCollectionLinks);
