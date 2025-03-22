import sum from "lodash/sum";
import groupBy from "lodash/groupBy";
import range from "lodash/range";
import moment from "moment";
import { CommentAutoRateLimit, RecentVoteInfo, UserKarmaInfo, IsActiveFunction, RateLimitFeatures } from "../lib/rateLimits/types";
import { calculateRecentKarmaInfo, getDownvoteRatio } from "../lib/rateLimits/utils";

function createVote(overrideVoteFields?: Partial<RecentVoteInfo>): RecentVoteInfo {
  const defaultVoteInfo = {
    _id: "vote1",
    documentId: "comment1",
    postedAt: new Date(),
    votedAt: new Date(),
    power: 1,
    collectionName: "Comments",
    userId: "user1",
    totalDocumentKarma: 0 
  } as const
  return {...defaultVoteInfo, ...overrideVoteFields}
} 

function createCommentVote(overrideVoteFields?: Omit<Partial<RecentVoteInfo>, "collectionName">): RecentVoteInfo {
  const defaultVoteInfo = {
    collectionName: "Comments",
  } as const
  return createVote({...defaultVoteInfo, ...overrideVoteFields})
} 

function createPostVote(overrideVoteFields?: Omit<Partial<RecentVoteInfo>, "collectionName">): RecentVoteInfo {
  const defaultVoteInfo = {
    collectionName: "Posts",
  } as const
  return createVote({...defaultVoteInfo, ...overrideVoteFields})
} 

function createCommentRateLimit(isActive: IsActiveFunction): CommentAutoRateLimit {
  return  {
    actionType: "Comments",
    timeframeUnit: 'days',
    timeframeLength: 2,
    itemsPerTimeframe: 1,
    rateLimitType: "lowKarma",
    rateLimitMessage: "",
    appliesToOwnPosts: false,
    isActive,
  } 
}

function createUserKarmaInfo(overrideFields?: Partial<UserKarmaInfo>): UserKarmaInfo {
  const defaultUserKarmaInfo = {
    karma: 0,
    bigDownvoteReceivedCount: 0,
    smallDownvoteReceivedCount: 0,
    voteReceivedCount: 0,
    smallUpvoteReceivedCount: 0,
    bigUpvoteReceivedCount: 0
  }
  return { ...defaultUserKarmaInfo, ...overrideFields}
}

function assignTotalDocumentKarma(votes: RecentVoteInfo[]) {
  const documentKarmaTotals = groupBy(votes, vote => vote.documentId);
  return votes.map(vote => ({
    ...vote,
    totalDocumentKarma: sum(documentKarmaTotals[vote.documentId].map(vote => vote.power))
  }));
}

export function calculateFeatures(userId: string, userKarmaInfo: UserKarmaInfo, allVotes: RecentVoteInfo[]): RateLimitFeatures {
  const recentKarmaInfo = calculateRecentKarmaInfo(userId, allVotes)
  const features = {
    ...recentKarmaInfo, 
    downvoteRatio: getDownvoteRatio(userKarmaInfo)
  }
  return features
}

describe("calculateRecentKarmaInfo", function () {

  let commentVotes: RecentVoteInfo[] = [
    ...range(20).map(k =>  createCommentVote({
      documentId: `comment${k}`,
      power: 1,
      postedAt: moment().subtract(k, 'days').toDate()
    })),
    ...range(6).map(k =>  createCommentVote({
      documentId: `comment${k}`,
      power: -1,
      postedAt: moment().subtract(k, 'days').toDate(),
      userId: `downvoter${k}`,
    })),
    ...range(2).map(k =>  createCommentVote({
      documentId: `comment${k}`,
      power: -1,
      postedAt: moment().subtract(k, 'days').toDate(),
      userId: `downvoterA`,
    }))
  ];

  commentVotes = assignTotalDocumentKarma(commentVotes);
  
  let postVotes: RecentVoteInfo[] = [
    ...range(20).map(k =>  createPostVote({
      documentId: `post${k}`,
      power: 2, 
      postedAt: moment().subtract(k+1, 'weeks').toDate()
    })),
    ...range(9).map(k =>  createPostVote({
      documentId: `post${k}`,
      power: -2, 
      postedAt: moment().subtract(k+1, 'weeks').toDate(),
      userId: `downvoter${k}`
    })),
    ...range(3).map(k =>  createPostVote({
      documentId: `post${k}`,
      power: -2, 
      postedAt: moment().subtract(k+1, 'weeks').toDate(),
      userId: `postDownvoterB`
    }))
  ];

  postVotes = assignTotalDocumentKarma(postVotes);
  
  const votes: RecentVoteInfo[] = [
    ...commentVotes,
    ...postVotes
  ]

  it("last20Karma only includes karma from most recent 20 contents", () => {
    const {last20Karma} = calculateRecentKarmaInfo("authorId", votes)
    expect(last20Karma).toEqual(6)
  })
  it("last20PostKarma only includes karma from most recent 20 posts", () => {
    const {last20PostKarma} = calculateRecentKarmaInfo("authorId", votes)
    expect(last20PostKarma).toEqual(16)
  })
  it("last20CommentKarma only includes karma from most recent 20 comments", () => {
    const {last20CommentKarma} = calculateRecentKarmaInfo("authorId", votes)
    expect(last20CommentKarma).toEqual(12)
  })
  it("downvoterCount includes all unique downvoters for recent 20 contents", () => {
    const {downvoterCount} = calculateRecentKarmaInfo("authorId", votes)
    expect(downvoterCount).toEqual(8)
  })
  it("postDownvoterCount includes all unique downvoters from most recent 20 posts", () => {
    const {postDownvoterCount} = calculateRecentKarmaInfo("authorId", votes)
    expect(postDownvoterCount).toEqual(10)
  })
  it("commentDownvoterCount includes all unique downvoters from most recent 20 comments", () => {
    const {commentDownvoterCount} = calculateRecentKarmaInfo("authorId", votes)
    expect(commentDownvoterCount).toEqual(7)
  })
  it("lastMonthKarma only includes votes from past month", () => {
    const {lastMonthKarma} = calculateRecentKarmaInfo("authorId", votes)
    expect(lastMonthKarma).toEqual(6)
  })
  it("lastMonthDownvoterCount includes all unique downvoters from past month content", () => {
    const {lastMonthDownvoterCount} = calculateRecentKarmaInfo("authorId", votes)
    expect(lastMonthDownvoterCount).toEqual(8)
  })
});

describe("shouldRateLimitApply", function () {
  const commentUpvotes = range(20).map(k => createCommentVote())
  const postDownVotes = range(20).map(k => createPostVote({power: -1}))
  const commentDownVotes = range(20).map(k => createCommentVote({power: -1}))
  const oldCommentDownvotes = range(20).map(k => createCommentVote({power: -1, postedAt: moment().subtract(5, 'weeks').toDate()}))

  it("returns true IFF user karma is less than karma threshold", () => {
    const rateLimit = createCommentRateLimit(user => user.karma <= 0)
    const user1 = createUserKarmaInfo({karma: 0})
    const features1 = calculateFeatures("authorId", user1, commentUpvotes) 
    const user2 = createUserKarmaInfo({karma: 1})
    const features2 = calculateFeatures("authorId", user2, commentUpvotes) 
    
    expect(rateLimit.isActive(user1, features1)).toEqual(true)
    expect(rateLimit.isActive(user2, features2)).toEqual(false)
  })
  it("returns true IFF recent user karma is less than last20KarmaThreshold", () => {
    const user1 = createUserKarmaInfo()
    const features1 = calculateFeatures("authorId", user1, commentUpvotes)
    const features2 = calculateFeatures("authorId", user1, commentDownVotes)
    const rateLimit = createCommentRateLimit((user, features) => features.last20Karma <= 0)
    
    expect(rateLimit.isActive(user1, features1)).toEqual(false)
    expect(rateLimit.isActive(user1, features2)).toEqual(true)
  })
  it("returns true IFF recent user post karma is less than recentPostKarmaThreshold", () => {
    const rateLimit = createCommentRateLimit((user, features) => features.last20PostKarma < 0)
    const user1 = createUserKarmaInfo()
    const featuresPostVotes = calculateFeatures("authorId", user1, postDownVotes)
    const featuresCommentVotes = calculateFeatures("authorId", user1, commentDownVotes)
    
    expect(rateLimit.isActive(user1, featuresPostVotes)).toEqual(true)
    expect(rateLimit.isActive(user1, featuresCommentVotes)).toEqual(false)
  })
  it("returns true IFF recent user comment karma is less than recentCommentKarmaThreshold", () => {
    const rateLimit = createCommentRateLimit((user, features) => features.last20CommentKarma < 0)
    const user1 = createUserKarmaInfo()
    const featuresPostVotes = calculateFeatures("authorId", user1, postDownVotes)
    const featuresCommentVotes = calculateFeatures("authorId", user1, commentDownVotes)
    
    expect(rateLimit.isActive(user1, featuresPostVotes)).toEqual(false)
    expect(rateLimit.isActive(user1, featuresCommentVotes)).toEqual(true)
  })
  it("returns true IFF lastMonthKarma is less than lastMonthKarmaKarmaThreshold", () => {
    const user1 = createUserKarmaInfo()
    const rateLimit = createCommentRateLimit((user, features) => features.lastMonthKarma < 0)
    const featuresOldCommentVotes = calculateFeatures("authorId", user1, oldCommentDownvotes)
    const featuresNewCommentVotes = calculateFeatures("authorId", user1, commentDownVotes)
    
    expect(rateLimit.isActive(user1, featuresOldCommentVotes)).toEqual(false)
    expect(rateLimit.isActive(user1, featuresNewCommentVotes)).toEqual(true)
  })
})
