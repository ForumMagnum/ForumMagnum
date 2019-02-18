import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import RSSFeeds from '../../lib/collections/rssfeeds/collection.js';
import Sequences from '../../lib/collections/sequences/collection.js';
import algoliasearch from 'algoliasearch';
import { getSetting } from 'meteor/vulcan:core';
import htmlToText from 'html-to-text';
import { dataToMarkdown } from '../editor/make_editable_callbacks'

const COMMENT_MAX_SEARCH_CHARACTERS = 2000

Comments.toAlgolia = (comment) => {
  const algoliaComment = {
    objectID: comment._id,
    _id: comment._id,
    userId: comment.userId,
    baseScore: comment.baseScore,
    score: comment.score,
    isDeleted: comment.isDeleted,
    retracted: comment.retracted,
    deleted: comment.deleted,
    spam: comment.spam,
    legacy: comment.legacy,
    userIP: comment.userIP,
    createdAt: comment.createdAt,
    postedAt: comment.postedAt,
    af: comment.af
  };
  const commentAuthor = Users.findOne({_id: comment.userId});
  if (commentAuthor && !commentAuthor.deleted) {
    algoliaComment.authorDisplayName = commentAuthor.displayName;
    algoliaComment.authorUserName = commentAuthor.username;
    algoliaComment.authorSlug = commentAuthor.slug;
  }
  const parentPost = Posts.findOne({_id: comment.postId});
  if (parentPost) {
    algoliaComment.postId = comment.postId;
    algoliaComment.postTitle = parentPost.title;
    algoliaComment.postSlug = parentPost.slug;
  }
  let body = ""
  if (comment.contents && comment.contents.originalContents && comment.contents.originalContents.type) {
    const { data, type } = comment.contents.originalContents
    body = dataToMarkdown(data, type)
  }
  //  Limit comment size to ensure we stay below Algolia search Limit
  //  TODO: Actually limit by encoding size as opposed to characters
  algoliaComment.body = body.slice(0, COMMENT_MAX_SEARCH_CHARACTERS)
  return [algoliaComment]
}

Sequences.toAlgolia = (sequence) => {
  const algoliaSequence = {
    objectID: sequence._id,
    _id: sequence._id,
    title: sequence.title,
    userId: sequence.userId,
    baseScore: sequence.baseScore,
    score: sequence.score,
    isDeleted: sequence.isDeleted,
    createdAt: sequence.createdAt,
    postedAt: sequence.postedAt,
    algoliaIndexAt: sequence.algoliaIndexAt,
    af: sequence.af
  };
  const sequenceAuthor = Users.findOne({_id: sequence.userId});
  if (sequenceAuthor) {
    algoliaSequence.authorDisplayName = sequenceAuthor.displayName;
    algoliaSequence.authorUserName = sequenceAuthor.username;
    algoliaSequence.authorSlug = sequenceAuthor.slug;
  }
  //  Limit comment size to ensure we stay below Algolia search Limit
  // TODO: Actually limit by encoding size as opposed to characters
  const { html = "" } = sequence.contents || {};
  const plaintextBody = htmlToText.fromString(html);
  algoliaSequence.plaintextDescription = plaintextBody.slice(0, 2000);
  return [algoliaSequence]
}

Users.toAlgolia = (user) => {
  const algoliaUser = {
    objectID: user._id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin,
    bio: user.bio,
    karma: user.karma,
    slug: user.slug,
    website: user.website,
    groups: user.groups,
    af: user.groups && user.groups.includes('alignmentForum')
  }
  return [algoliaUser];
}


// TODO: Refactor this to no longer by this insane parallel code path, and instead just make a graphQL query and use all the relevant data
Posts.toAlgolia = (post) => {
  const algoliaMetaInfo = {
    _id: post._id,
    userId: post.userId,
    url: post.url,
    title: post.title,
    slug: post.slug,
    baseScore: post.baseScore,
    score: post.score,
    status: post.status,
    legacy: post.legacy,
    commentCount: post.commentCount,
    userIP: post.userIP,
    createdAt: post.createdAt,
    postedAt: post.postedAt,
    isFuture: post.isFuture,
    viewCount: post.viewCount,
    lastCommentedAt: post.lastCommentedAt,
    draft: post.draft,
    af: post.af
  };
  const postAuthor = Users.findOne({_id: post.userId});
  if (postAuthor && !postAuthor.deleted) {
    algoliaMetaInfo.authorSlug = postAuthor.slug;
    algoliaMetaInfo.authorDisplayName = postAuthor.displayName;
    algoliaMetaInfo.authorFullName = postAuthor.fullName;
  }
  const postFeed = RSSFeeds.findOne({_id: post.feedId});
  if (postFeed) {
    algoliaMetaInfo.feedName = postFeed.nickname;
    algoliaMetaInfo.feedLink = post.feedLink;
  }
  let postBatch = [];
  let body = ""
  if (post.contents && post.contents.originalContents && post.contents.originalContents.type) {
    const { data, type } = post.contents.originalContents
    body = dataToMarkdown(data, type)
  }
  if (body) {
    body.split("\n\n").forEach((paragraph, paragraphCounter) => {
      postBatch.push(_.clone({
        ...algoliaMetaInfo,
        objectID: post._id + "_" + paragraphCounter,
        body: paragraph,
      }));
    })
  } else {
    postBatch.push(_.clone(algoliaMetaInfo));
  }
  return postBatch;
}

// Slightly gross function to turn these callback-accepting functions
// into async ones
// If waitForFinish is false, let algolia index the post on it's own time. This
// takes forever, so it should usually be false. It tries to give you any errors
// ahead of time.
export async function batchAdd(algoliaIndex, objects, waitForFinish) {
  const addObjectsPartialAsync = () => {
    return new Promise((resolve, reject) => {
      algoliaIndex.addObjects(objects, (err, content) => {
        if (err) {
          reject(err)
          return
        }
        resolve(content)
      })
    })
  }
  const awaitObjectInsert = (taskID) => {
    return new Promise((resolve, reject) => {
      algoliaIndex.waitTask(taskID, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }
  try {
    const content = await addObjectsPartialAsync()
    if (waitForFinish) {
      await awaitObjectInsert(content.taskID)
    } else {
      algoliaIndex.waitTask(content.taskID, (err) => {
        // We really hope it's rare for it to error only after finishing
        // indexing. If we have to wait for this error every time, it'll take
        // possibly >24hr to export comments.
        if (err) {
          // eslint-disable-next-line no-console
          console.error(
            'Apparently algolia sometimes errors even after the first ack\n' +
            'Please make a note of this error and then be frustrated about' +
            'how to change the code to do a better job of catching it.'
          )
          // eslint-disable-next-line no-console
          console.error(err)
        }
      })
    }
  } catch (err) {
    return err
  }
}

export function getAlgoliaAdminClient()
{
  const algoliaAppId = getSetting('algolia.appId');
  const algoliaAdminKey = getSetting('algolia.adminKey');
  
  if (!algoliaAppId || !algoliaAdminKey) {
    if (!Meteor.isTest && !Meteor.isAppTest && !Meteor.isPackageTest) {
      //eslint-disable-next-line no-console
      console.info("No Algolia credentials found. To activate search please provide 'algolia.appId' and 'algolia.adminKey' in the settings")
    }
    return null;;
  }
  
  let client = algoliasearch(algoliaAppId, algoliaAdminKey);
  return client;
}

export async function algoliaDocumentExport({ documents, collection, indexName, exportFunction, updateFunction} ) {
  // if (Meteor.isDevelopment) {  // Only run document export in production environment
  //   return null
  // }
  let client = getAlgoliaAdminClient();
  if (!client) return;
  let algoliaIndex = client.initIndex(indexName);

  let importCount = 0;
  let importBatch = [];
  let totalErrors = [];
  for (let item of documents) {
    if (updateFunction) updateFunction(item);
    let batchContainer = exportFunction(item);
    importBatch = [...importBatch, ...batchContainer];
    importCount++;
    if (importCount % 100 == 0) {
      let error = await batchAdd(algoliaIndex, _.map(importBatch, _.clone), false);
      if(error) totalErrors.push(error);
      importBatch = [];
    }
  }
  
  let error = await batchAdd(algoliaIndex, _.map(importBatch, _.clone), false);
  if(error) totalErrors.push(error);
  
  //eslint-disable-next-line no-console
  console.error("Encountered the following errors: ", totalErrors)
}
