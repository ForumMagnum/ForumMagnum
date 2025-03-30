import Collections from "../../server/collections/collections/collection";
import Sequences from "../../server/collections/sequences/collection";
import { Posts } from "../../server/collections/posts/collection";
import { runQuery } from '../vulcan-lib/query';
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

async function getAllCollectionPosts(id: string | null) {
  if (!id) return Promise.resolve({posts: [], sequences: [], collectionSlug: ""});
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

export async function updateCollectionLinks(book: DbBook) {
  const collectionId = book.collectionId
  const results = await getAllCollectionPosts(collectionId)

  //eslint-disable-next-line no-console
  console.log(`Updating Collection Links for ${collectionId}...`)

  await Collections.rawUpdateOne(collectionId, { $set: {
    firstPageLink: "/" + results.collectionSlug + "/" + results.posts[0].slug
  }})


  // The following two functions calls cause every sequence and post included in this collection 
  // to have their canonicalCollectionSlug, next post, previous, etc. updated. This makes 
  // sense when the collection is works of a single author like R:A-Z or Codex, but caused 
  // a lot of issues when making the Best Of collection that clobbered correct Sequence 
  // association info and messed up navigation.
  //
  // Commenting out for now but leaving in case we ever want to make a canonical collection 
  // for something like R:A-Z or Codex again.
  // await updateCollectionSequences(results.sequences, results.collectionSlug)
  // await updateCollectionPosts(results.posts, results.collectionSlug)

  //eslint-disable-next-line no-console
  // console.log(`...finished Updating Collection Links for ${collectionId}`)
}
