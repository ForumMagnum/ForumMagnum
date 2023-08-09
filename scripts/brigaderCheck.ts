import { MongoClient, Db } from "mongodb";
import { readFile } from "fs/promises";
import { groupBy } from "lodash";

type Vote = {
  _id: string,
  userId: string,
  documentId: string,
  collectionName: string,
  voteType: "bigDownvote" | "smallDownvote",
  power: number,
  votedAt: Date,
}

const voteProjection = {
  _id: 1,
  userId: 1,
  documentId: 1,
  collectionName: 1,
  voteType: 1,
  power: 1,
  votedAt: 1,
} as const;

const downvoteParams = {
  voteType: {$in: ["smallDownvote", "bigDownvote"]},
  cancelled: false,
  isUnvote: false,
} as const;

type User = {
  _id: string,
  slug: string,
  email: string,
  karma?: number,
  createdAt: Date,
}

const userProjection = {
  _id: 1,
  slug: 1,
  email: 1,
  karma: 1,
  createdAt: 1,
} as const;

type Brigader = {
  downvotedPost: boolean,
  downvoteCommentCount: number,
  userSlug?: string,
  userEmail?: string,
  userKarma?: number,
  userCreatedAt?: Date,
}

const getPostVotes = (db: Db, postId: string): Promise<Vote[]> =>
  db.collection("votes").find({
    documentId: postId,
    ...downvoteParams,
  }, {projection: voteProjection}).toArray();

const getCommentIds = async (db: Db, postId: string): Promise<string[]> => {
  const commentIds = await db.collection("comments").find({postId}, {
    projection: {_id: 1},
  }).toArray();
  return commentIds.map(({_id}) => _id);
}

const getUserCommentCounts = async (
  db: Db,
  commentIds: string[],
): Promise<Record<string, {downvotedCommentCount: number, user: User}>> => {
  const comments: {userId: string}[] = await db.collection("comments").find({
    _id: {$in: commentIds},
  }, {projection: {userId: 1}}).toArray();
  const grouped = groupBy(comments, "userId");
  const users: User[] = await getUsers(db, Object.keys(grouped));
  return Object.fromEntries(
    Object.entries(grouped)
      .map(([userId, comments]) => [userId, {
        downvotedCommentCount: comments.length,
        user: users.find(({_id}: {_id: string}) => userId === _id)!,
      }])
  );
}

const getCommentVotes = async (db: Db, postId: string): Promise<Vote[]> => {
  const commentIds = await getCommentIds(db, postId);
  return db.collection("votes").find({
    documentId: {$in: commentIds},
    ...downvoteParams,
  }, {projection: voteProjection}).toArray();
}

const getUsers = async (db: Db, userIds: string[]): Promise<User[]> =>
  db.collection("users").find({
    _id: {$in: userIds},
  }, {projection: userProjection}).toArray();

const getDownvoters = (votes: Vote[]): Set<string> =>
  new Set(votes.map(({userId}) => userId));

const intersection = <T>(a: Set<T>, b: Set<T>): Set<T> =>
  new Set([...a].filter(x => b.has(x)));

const checkVotesForUser = async (db: Db, postId: string, userId?: string) => {
  console.log(`\nChecking votes for post ${postId} by user ${userId}:\n`);

  const commentVotes = await getCommentVotes(db, postId);
  const userCommentVoteIds = commentVotes
    .filter((vote) => vote.userId === userId)
    .map(({documentId}) => documentId);
  const comments = await getUserCommentCounts(db, userCommentVoteIds);
  console.log(comments);
}

const checkVotes = async (db: Db, postId: string) => {
  console.log(`\nChecking brigaders for post ${postId}:\n`);

  const commentVotes = await getCommentVotes(db, postId);
  const postVotes = await getPostVotes(db, postId);

  const postDownvoters = getDownvoters(postVotes);
  const commentDownvoters = getDownvoters(commentVotes);
  const commonDownvoters = intersection(postDownvoters, commentDownvoters);
  console.log("Downvoters:");
  console.log(` > ${postDownvoters.size} post downvoters`);
  console.log(` > ${commentDownvoters.size} comment downvoters`);
  console.log(` > ${commonDownvoters.size} in common`);

  const grouped = groupBy(commentVotes, "userId");
  const brigaders: Record<string, Brigader> = Object.fromEntries(Object.entries(grouped)
    .filter(([_, votes]) => votes.length > 3)
    .map(([user, votes]) => [user, {
      downvotedPost: postDownvoters.has(user),
      downvoteCommentCount: votes.length,
    }])
  );

  const users = await getUsers(db, Object.keys(brigaders));
  for (const user of users) {
    brigaders[user._id] = {
      ...brigaders[user._id],
      userSlug: user.slug,
      userEmail: user.email,
      userKarma: user.karma,
      userCreatedAt: user.createdAt,
    };
  }

  console.log("\nPotential brigaders:");
  console.table(brigaders)
  console.log();
}

const helpMessage = `
Usage: yarn brigader-check [POST_ID] [USER_ID]

 - POST_ID specifies the post to check
 - USER_ID is optional and will check the voting of the given user on the post
`;

const brigaderCheck = async (postId?: string, userId?: string) => {
  if (!postId) {
    console.error(helpMessage);
    process.exit(1);
  }
  // TODO: this is broken
  throw new Error("Needs to use postgres")
  // const mongoPath = "../ForumCredentials/prod-db-conn.txt";
  // const mongoUrl = (await readFile(mongoPath)).toString().trim();
  // const client = new MongoClient(mongoUrl, {useUnifiedTopology: true});
  // await client.connect();
  // const db = client.db();
  // if (userId) {
  //   await checkVotesForUser(db, postId, userId);
  // } else {
  //   await checkVotes(db, postId);
  // }
  // await client.close();
}

brigaderCheck(process.argv[2], process.argv[3]);
