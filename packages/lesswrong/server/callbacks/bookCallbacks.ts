import Collections from "../../lib/collections/collections/collection";
import Sequences from "../../lib/collections/sequences/collection";
import { Posts } from "../../lib/collections/posts";
import { runQuery } from '../vulcan-lib';
import { getCollectionHooks } from '../mutationCallbacks';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
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

  collection.books.forEach((book: AnyBecauseTodo) => {
    const bookPosts = book.posts.map((post: AnyBecauseTodo) => {
      post.canonicalBookId = book._id
      return post
    })
    allCollectionPosts = allCollectionPosts.concat(bookPosts);
    allCollectionSequences = allCollectionSequences.concat(book.sequences);
    book.sequences.forEach((sequence: AnyBecauseTodo) => {
      sequence.chapters.forEach((chapter: AnyBecauseTodo) => {
        const newPosts = chapter.posts.map((post: AnyBecauseTodo) => {
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

async function updateCollectionSequences(sequences: Array<DbSequence>, collectionSlug: string) {
  await asyncForeachSequential(_.range(sequences.length), async (i) => {
    await Sequences.rawUpdateOne(sequences[i]._id, {$set: {
      canonicalCollectionSlug: collectionSlug,
    }});
  })
}

async function updateCollectionPosts(posts: Array<DbPost>, collectionSlug: string) {
  await asyncForeachSequential(_.range(posts.length), async (i) => {
    const currentPost = posts[i]

    let prevPost = {slug:""}
    let nextPost = {slug:""}
    if (i-1>=0) {
      prevPost = posts[i-1]
    }
    if (i+1<posts.length) {
      nextPost = posts[i+1]
    }
    await Posts.rawUpdateOne({slug: currentPost.slug}, {$set: {
      canonicalPrevPostSlug: prevPost.slug,
      canonicalNextPostSlug: nextPost.slug,
      canonicalBookId: currentPost.canonicalBookId,
      canonicalCollectionSlug: collectionSlug,
      canonicalSequenceId: currentPost.canonicalSequenceId,
    }});
  })
}

getCollectionHooks("Books").editAsync.add(async function UpdateCollectionLinks (book: DbBook) {
  const collectionId = book.collectionId
  const results = await getAllCollectionPosts(collectionId)

  //eslint-disable-next-line no-console
  console.log(`Updating Collection Links for ${collectionId}...`)

  await Collections.rawUpdateOne(collectionId, { $set: {
    firstPageLink: "/" + results.collectionSlug + "/" + results.posts[0].slug
  }})

  await updateCollectionSequences(results.sequences, results.collectionSlug)
  await updateCollectionPosts(results.posts, results.collectionSlug)

  //eslint-disable-next-line no-console
  console.log(`...finished Updating Collection Links for ${collectionId}`)
});
