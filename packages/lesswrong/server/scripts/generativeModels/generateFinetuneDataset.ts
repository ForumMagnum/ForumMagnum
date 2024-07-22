import { Globals } from '@/lib/vulcan-lib/config';
import { getDefaultViewSelector, mergeSelectors } from "@/lib/utils/viewUtils";
import { Comments } from '@/lib/collections/comments/collection';
import { Posts } from '@/lib/collections/posts/collection';
import { Users } from '@/lib/collections/users/collection';
import { dataToMarkdown } from '@/server/editor/conversionUtils';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import chunk from 'lodash/chunk';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import keyBy from 'lodash/keyBy';
import { postprocessMarkdown } from '@/server/languageModels/llmUtil';
import shuffle from 'lodash/shuffle';

type HighKarmaContentDatasetOptions = {
  postKarmaThreshold: number
  commentKarmaThreshold: number
  outputFilename: string

  // Filter for posts to include. This will be merged with the default post
  // view, which takes care of excluding drafts, spam, etc, and with the
  // postKarmaThreshold option above.
  postFilter: ViewQueryAndOptions<"Posts",DbPost>["selector"]
  
  // Filter for comments to include. This will be merged with the default
  // comment view, which takes care of excluding deleted comments.
  commentFilter: ViewQueryAndOptions<"Comments",DbComment>["selector"]
  
  // Whether to include shortform posts (ie top-level comments on shortform
  // containers.)
  includeShortformTopLevelComments: boolean
  
  // Whether to include comments (other than top-level shortform). If this is
  // "onlyIfPostIncluded", a comment will be included only if the post it's on
  // is included (or if it's under a shortform, the top-level shortform
  // comment).
  //
  // (Regardless of this setting, commentFilter and commentKarmaThreshold are
  // still applied.)
  includeReplyComments: "all"|"onlyIfPostIncluded"|"none"
  
  documentSeparator: string,
}
const defaultHighKarmaContentDatasetOptions: HighKarmaContentDatasetOptions = {
  postKarmaThreshold: 60,
  commentKarmaThreshold: 30,
  outputFilename: "ml/finetuneData.txt",
  postFilter: {
    frontpageDate: {$gt: new Date(0)}
  },
  commentFilter: {},
  includeShortformTopLevelComments: true,
  includeReplyComments: "all",
  documentSeparator: "========",
}

async function generateHighKarmaContentDataset(_options?: Partial<HighKarmaContentDatasetOptions>) {
  const options = {...defaultHighKarmaContentDatasetOptions, ..._options};
  const startTime = new Date();

  await withStreamingWrite(options.outputFilename, async (write) => {
    await writeHighKarmaContentDatasetTo(options, write);
    // eslint-disable-next-line no-console
    console.log(`Finetune dataset generated in ${new Date().getTime() - startTime.getTime()}ms`);
  });
}

async function withStreamingWrite(
  filename: string,
  fn: (write: (s: string) => Promise<void>) => Promise<void>
): Promise<void> {
  ensurePathExists(filename);
  const fileHandle = await fsPromises.open(filename, 'w');
  if (!fileHandle) {
    throw new Error(`Unable to open ${filename} for writing`);
  }
  try {
    const writeStream = fileHandle.createWriteStream();
    // eslint-disable-next-line no-inner-declarations
    async function write(s: string) {
      return new Promise<void>((resolve, reject) => {
        writeStream.write(s, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    await fn(write);
  } finally {
    await fileHandle.close();
  }
}

async function writeHighKarmaContentDatasetTo(options: HighKarmaContentDatasetOptions, write: (s: string) => Promise<void>) {
  // eslint-disable-next-line no-console
  const log = console.log;
  
  ////////////////////////////////////////////////////////////////////
  // Data selection stage
  // First we collect IDs of posts and comments that will be included (without
  // downloading their bodies from the DB). This is split out so that you can
  // iterate on filters to see how much will be included, without waiting for
  // the slow parts (downloading contents from the DB and doing format
  // conversions), and to work around the possibility of out-of-memory issues.
  
  log("Generating fine-tune dataset", options);

  log("Collecting list of posts to include");
  const postSelector = mergeSelectors(
    getDefaultViewSelector("Posts"),
    {baseScore: {$gte: options.postKarmaThreshold}},
    options.postFilter
  );
  
  const includedPostIds = new Set<string>();
  const commentIdsByPost = new Map<string,string[]>();
  const commentIdsByShortform = new Map<string,string[]>();
  const userIds = new Set<string>();

  for (let post of await Posts.find(postSelector, {projection: {_id: true, userId: true}}).fetch()) {
    includedPostIds.add(post._id);
    commentIdsByPost.set(post._id, []);
    userIds.add(post.userId);
  }
  log(`Found ${includedPostIds.size} posts`);
  
  log("Collecting list of comments to include");
  const commentSelector = mergeSelectors(
    getDefaultViewSelector("Comments"),
    {baseScore: {$gte: options.commentKarmaThreshold}},
    options.commentFilter
  );
  
  if (options.includeShortformTopLevelComments) {
    log("Collecting shortform top-level comments");
    for (let comment of await Comments.find(
      {...commentSelector, shortform: true, parentCommentId: null},
      {projection: {_id: true, userId: true}}).fetch()
    ) {
      commentIdsByShortform.set(comment._id, [comment._id]);
      userIds.add(comment.userId);
    }
  }

  if (options.includeReplyComments === "all") {
    for (let comment of await Comments.find(commentSelector, {projection: {_id: true, postId: true}}).fetch()) {
      const postId = comment.postId ?? "";
      if (!commentIdsByPost.has(postId))
        commentIdsByPost.set(postId, []);
      commentIdsByPost.get(postId)!.push(comment._id);
      userIds.add(comment.userId);
    }
  } else if (options.includeReplyComments === "onlyIfPostIncluded") {
    const potentiallyIncludedComments = new Map<string, {parentCommentId: string|null, postId: string|null, topLevelCommentId: string|null, userId: string}>();
    for (let comment of await Comments.find(
      commentSelector,
      {projection: {_id: true, parentCommentId: true, postId: true, topLevelCommentId: true, userId: true}}
    ).fetch()) {
      potentiallyIncludedComments.set(comment._id, {parentCommentId: comment.parentCommentId, postId: comment.postId, topLevelCommentId: comment.topLevelCommentId, userId: comment.userId});
      userIds.add(comment.userId);
    }
    
    for (let comment of potentiallyIncludedComments) {
      const [commentId, {parentCommentId, postId, topLevelCommentId}] = comment;
      
      // Comment must be on an included post or an included shortform
      if (!(postId && includedPostIds.has(postId)) && !(topLevelCommentId && commentIdsByShortform.has(topLevelCommentId))) {
        continue;
      }
      
      if (topLevelCommentId && commentIdsByShortform.has(topLevelCommentId)) {
        commentIdsByShortform.get(topLevelCommentId)!.push(commentId);
      } else if (postId) {
        if (!commentIdsByPost.has(postId))
          commentIdsByPost.set(postId, []);
        commentIdsByPost.get(postId)!.push(commentId);
      }
    }
  }
  
  log(`Finished selecting posts and comments to include: ${includedPostIds.size} posts, ${[...commentIdsByPost.values()].flat().length} comments on posts, and ${[...commentIdsByShortform.values()].flat().length} comments on shortform`);
  
  const authorNameCache = new Map<string,string>();
  const usersById = keyBy(
    await Users.find(
      {_id: {$in: [...userIds.values()]}},
      {projection: {_id: true, deleted: true, displayName: true}}
    ).fetch(),
    u => u._id
  );
  
  async function getAuthorName(userId: string): Promise<string> {
    if (authorNameCache.has(userId)) {
      return authorNameCache.get(userId)!;
    }
    
    const author = (userId in usersById) ? usersById[userId] : await Users.findOne({_id: userId});
    const name = (!author || author.deleted || !author.displayName)
      ? "[anonymous]"
      : author.displayName;
    authorNameCache.set(userId, name);
    return name;
  }

  for (let postBatch of chunk([...commentIdsByPost.keys()], 50)) {
    // Fetch posts and comments related to a batch. Note that depending on
    // filter options, a comment may be included without the corresponding post.
    // If there are comments on an excluded post, postBatch contains the post ID
    // but postIds does not.
    const postIds = postBatch.filter(postId => includedPostIds.has(postId));
    const commentIds = postBatch.map(postId => commentIdsByPost.get(postId)!).flat();
    const [posts, comments] = await Promise.all([
      Posts.find({_id: {$in: postIds}}).fetch(),
      Comments.find({_id: {$in: commentIds}}).fetch()
    ]);
    
    const commentsByPost = groupBy(comments, c=>c.postId);
    let first = true;
    for (const postId of postBatch) {
      const rendered = await renderForFinetune({
        options,
        post: posts.find(p=>p._id===postId) ?? null,
        comments: commentsByPost[postId] ?? [],
        getAuthorName,
      });
      await write(rendered);
    }
  }
  
  const commentsOnShortform = await Comments.find({
    _id: {$in: [...commentIdsByShortform.values()].flat()}
  }).fetch();
  const commentsByShortform = groupBy(commentsOnShortform, c=>c.topLevelCommentId ?? c._id);
  let first = true;
  for (const shortformCommentId of [...commentIdsByShortform.keys()]) {
    const rendered = await renderForFinetune({
      options,
      post: null,
      comments: commentsByShortform[shortformCommentId],
      getAuthorName,
    });
    await write(rendered);
  }

  // eslint-disable-next-line no-console
  log(`Finished generating fine-tune data: ${options.outputFilename}`);
}

async function renderForFinetune({options, post, comments, getAuthorName}: {
  options: HighKarmaContentDatasetOptions,
  post: DbPost|null
  comments: DbComment[],
  getAuthorName: (authorId: string) => Promise<string>
}) {
  const sb: string[] = [];
  
  if (post) {
    sb.push(await renderPostForFinetune({post, getAuthorName}));
  } else {
    sb.push("Shortform\n\n");
  }
  
  const sortedComments: DbComment[] = sortBy(comments, c=>c.postedAt);
  for (let comment of sortedComments) {
    sb.push(options.documentSeparator+'\n\n');
    sb.push(await renderCommentForFinetune({comment, getAuthorName}));
  }
  
  sb.push(options.documentSeparator+"\n\n");
  return sb.join("");
}

async function renderPostForFinetune({ post, getAuthorName }: {
  post: DbPost
  getAuthorName: (authorId: string) => Promise<string>
}) {
  const sb: string[] = [];
  sb.push(`${post.title}\n`)
  sb.push(`by ${await getAuthorName(post.userId)}\n`)
  sb.push(`${post.baseScore} points\n`);
  sb.push(`\n`);
  if ('url' in post && post.url) {
    sb.push(`This is a linkpost for ${post.url}\n\n`);
  }
  const body = post.contents?.originalContents;
  if (body) {
    const bodyMarkdown = dataToMarkdown(body.data, body.type);
    sb.push(postprocessMarkdown(bodyMarkdown));
    sb.push('\n\n');
  }
  return sb.join('');
}

async function renderCommentForFinetune({ comment, getAuthorName }: {
  comment: DbComment
  getAuthorName: (authorId: string) => Promise<string>
}) {
  const sb: string[] = [];
  sb.push(`Comment by ${await getAuthorName(comment.userId)}\n\n`);
  const body = comment.contents?.originalContents;
  if (body) {
    const bodyMarkdown = dataToMarkdown(body.data, body.type);
    sb.push(postprocessMarkdown(bodyMarkdown));
    sb.push('\n\n');
  }
  return sb.join('');
}

/**
 * Ensure the given directory exists and is a directory. Checks path components
 * in order; if any don't exist, creates them with fs.mkdirSync. If any path
 * component exists but isn't a directory, throws an exception.
 */
function ensurePathExists(filename: string): void {
  const dirname = path.dirname(filename);
  const normalizedPath = path.normalize(dirname);
  const pathComponents = normalizedPath.split(path.sep);
  
  for (let i=0; i<pathComponents.length; i++) {
    const currentPath = pathComponents.slice(0,i+1).join(path.sep);
    
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    } else {
      const stats = fs.statSync(currentPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path exists but is not a directory: ${currentPath}`);
      }
    }
  }
}

Globals.generateHighKarmaContentDataset = generateHighKarmaContentDataset



type PostResponsePairsOptions = {
  outputFilename: string

  postKarmaThreshold: number
  commentKarmaThreshold: number
  examplesCount: number

  // Filter for posts to include. This will be merged with the default post
  // view, which takes care of excluding drafts, spam, etc, and with the
  // postKarmaThreshold option above.
  postFilter: ViewQueryAndOptions<"Posts",DbPost>["selector"]
  
  // Filter for comments to include. This will be merged with the default
  // comment view, which takes care of excluding deleted comments.
  commentFilter: ViewQueryAndOptions<"Comments",DbComment>["selector"]
  
  systemPrompt: "You are highly capable writing assistant that helps authors by replying to their essays as other people will. Your replies may riff on, refute, or comment on the essay or the essay's topic."
}

const defaultPostResponsePairsOptions = {
  outputFilename: "ml/postResponsePairs.json",
  commentKarmaThreshold: 50,
  postKarmaThreshold: -20,
  examplesCount: 500,

  postFilter: {
    frontpageDate: {$gt: new Date(0)}
  },
}

async function generatePostResponsePairsDataset(_options: PostResponsePairsOptions) {
  const options = {...defaultPostResponsePairsOptions, ..._options};
  const startTime = new Date();
  await withStreamingWrite(options.outputFilename, async (write) => {
    console.log("Selecting comments for post-comment pairs data");
    // Pick random high-karma comments that meet the requirements
    const commentSelector = mergeSelectors(
      getDefaultViewSelector("Comments"),
      options.commentFilter,
      {
        baseScore: {$gte: options.commentKarmaThreshold},
        postId: {$ne: null},
        parentCommentId: null,
      },
    );
    const eligibleComments = await Comments.find(commentSelector, {
      projection: {_id: true, postId: true}
    }).fetch();

    console.log("Getting posts for post-comment pairs data");
    const postSelector = mergeSelectors(
      getDefaultViewSelector("Posts"),
      options.postFilter
    );
    const eligiblePostIds = (await Posts.find(postSelector, {
      projection: {_id: true}
    }).fetch()).map(p => p._id);
    const eligiblePostIdsSet = new Set<string>(eligiblePostIds);
    
    const eligibleCommentsOnEligiblePosts = eligibleComments
      .filter(c => c.postId && eligiblePostIdsSet.has(c.postId));
    const commentIds = shuffle(eligibleCommentsOnEligiblePosts).slice(0, options.examplesCount);
    
    console.log("Downloading full posts/comments");
    const comments = await Comments.find({
      _id: {$in: commentIds.map(c=>c._id)}
    }).fetch();
    const postIds = new Set(comments.map(c => c.postId));
    const posts = await Posts.find({
      _id: {$in: [...postIds.values()]}
    }).fetch();
    const postsById = keyBy(posts, p=>p._id);
    
    const getAuthorName = async (userId: string) => "AnonymizedUser"

    console.log("Writing out examples");
    const data: any[] = [];
    for (let comment of comments) {
      const post = postsById[comment.postId!];
      const renderedPost = await renderPostForFinetune({post, getAuthorName})
      const renderedComment = await renderCommentForFinetune({comment, getAuthorName})
      const example = {
        messages: [
          {role: "system", content: options.systemPrompt},
          {role: "user", content: renderedPost},
          {role: "assistant", content: renderedComment},
        ],
      };
      await write(JSON.stringify(example)+"\n");
    }
    // eslint-disable-next-line no-console
    console.log(`Finetune dataset generated in ${new Date().getTime() - startTime.getTime()}ms`);
  });
}



Globals.generatePostResponsePairs = generatePostResponsePairsDataset
