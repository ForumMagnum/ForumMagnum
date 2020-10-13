import Collections from "../../lib/collections/collections/collection";
import Sequences from "../../lib/collections/sequences/collection";
import { Books, makeEditableOptions } from '../../lib/collections/books/collection'
import { Posts } from "../../lib/collections/posts";
import { addCallback, runQuery } from '../vulcan-lib';
import { addEditableCallbacks } from '../editor/make_editable_callbacks';
import * as _ from 'underscore';

async function getCompleteCollection(id: string) {
  const query = `
  query CodexComplete {
    collection(input: {selector: {documentId:"${id}"}}) {
      result{
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
    }   
  }`;
  const result = await runQuery(query)
  return result
}

async function getAllCollectionPosts(id: string) {
  let queryResult: any = await getCompleteCollection(id);

  let allCollectionPosts: Array<any> = [];
  let allCollectionSequences: Array<any> = [];
  const collection = queryResult.data.collection.result

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

function updateCollectionSequences(sequences: Array<DbSequence>, collectionSlug: string) {
  _.range(sequences.length).forEach((i) => {
    Sequences.update(sequences[i]._id, {$set: {
      canonicalCollectionSlug: collectionSlug,
    }});
  })
}

function updateCollectionPosts(posts: Array<DbPost>, collectionSlug: string) {
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

async function UpdateCollectionLinks (book: DbBook) {
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

addEditableCallbacks({collection: Books, options: makeEditableOptions})
