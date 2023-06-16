import range from "lodash/range";
import moment from "moment";
import { CommentAutoRateLimit, PostAutoRateLimit, RateLimitInfo, UserKarmaInfo } from "../server/rateLimits/types";
import { calculateRecentKarmaInfo, shouldRateLimitApply } from "../server/rateLimits/utils";
import { RecentVoteInfo } from "../server/repos/VotesRepo";

function createVote(overrideVoteFields?: Partial<RecentVoteInfo>): RecentVoteInfo {
  const defaultVoteInfo = {
    _id: "vote1",
    documentId: "comment1",
    postedAt: new Date(),
    power: 1,
    collectionName: "Comments",
    userId: "user1"
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

function createCommentRateLimit(overrideFields?: Partial<CommentAutoRateLimit>): CommentAutoRateLimit {
  const defaultRateLimitInfo = {
    actionType: "Comments",
    timeframeUnit: 'days',
    timeframeLength: 2,
    itemsPerTimeframe: 1,
    rateLimitType: "lowKarma",
    rateLimitMessage: "",
    appliesToOwnPosts: false
  } as const
  return {...defaultRateLimitInfo, ...overrideFields}
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

describe("calculateRecentKarmaInfo", function () {

  const commentVotes: RecentVoteInfo[] = [
    ...range(20).map(k =>  createCommentVote({
      documentId: `comment${k}`,
      power: 1,
      postedAt: moment().subtract(k, 'days').toDate()
    })),
    ...range(6).map(k =>  createCommentVote({
      documentId: `comment${k}`,
      power: -1,
      postedAt: moment().subtract(k, 'days').toDate(),
      userId: `downvoter${k}`
    })),
    ...range(2).map(k =>  createCommentVote({
      documentId: `comment${k}`,
      power: -1,
      postedAt: moment().subtract(k, 'days').toDate(),
      userId: `downvoterA`
    }))
  ]
  
  const postVotes: RecentVoteInfo[] = [
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
  ]
  
  const votes: RecentVoteInfo[] = [
    ...commentVotes,
    ...postVotes
  ]

  it("recentKarma only includes karma from most recent 20 contents", () => {
    const {recentKarma} = calculateRecentKarmaInfo("authorId", votes)
    expect(recentKarma).toEqual(6)
  })
  it("recentPostKarma only includes karma from most recent 20 posts", () => {
    const {recentPostKarma} = calculateRecentKarmaInfo("authorId", votes)
    expect(recentPostKarma).toEqual(16)
  })
  it("recentCommentKarma only includes karma from most recent 20 comments", () => {
    const {recentCommentKarma} = calculateRecentKarmaInfo("authorId", votes)
    expect(recentCommentKarma).toEqual(12)
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
    const recentKarmaInfo = calculateRecentKarmaInfo("authorId", commentUpvotes)
    const rateLimit = createCommentRateLimit({karmaThreshold: 0})
    const user1 = createUserKarmaInfo({karma: 0})
    const user2 = createUserKarmaInfo({karma: 1})
    
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfo)).toEqual(true)
    expect(shouldRateLimitApply(user2, rateLimit, recentKarmaInfo)).toEqual(false)
  })
  it("returns true IFF recent user karma is less than recentKarmaThreshold", () => {
    const recentKarmaInfo1 = calculateRecentKarmaInfo("authorId", commentUpvotes)
    const recentKarmaInfo2 = calculateRecentKarmaInfo("authorId", commentDownVotes)
    const rateLimit = createCommentRateLimit({recentKarmaThreshold: 0})
    const user1 = createUserKarmaInfo()
    
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfo1)).toEqual(false)
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfo2)).toEqual(true)
  })
  it("returns true IFF recent user post karma is less than recentPostKarmaThreshold", () => {
    const recentKarmaInfoPostVotes = calculateRecentKarmaInfo("authorId", postDownVotes)
    const recentKarmaInfoCommentVotes = calculateRecentKarmaInfo("authorId", commentDownVotes)
    const rateLimit = createCommentRateLimit({recentPostKarmaThreshold: -1})
    const user1 = createUserKarmaInfo()
    
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfoPostVotes)).toEqual(true)
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfoCommentVotes)).toEqual(false)
  })
  it("returns true IFF recent user comment karma is less than recentCommentKarmaThreshold", () => {
    const recentKarmaInfoPostVotes = calculateRecentKarmaInfo("authorId", postDownVotes)
    const recentKarmaInfoCommentVotes = calculateRecentKarmaInfo("authorId", commentDownVotes)
    const rateLimit = createCommentRateLimit({recentCommentKarmaThreshold: -1})
    const user1 = createUserKarmaInfo()
    
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfoPostVotes)).toEqual(false)
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfoCommentVotes)).toEqual(true)
  })
  it("returns true IFF lastMonthKarma is less than lastMonthKarmaKarmaThreshold", () => {
    const recentKarmaInfoOldCommentVotes = calculateRecentKarmaInfo("authorId", oldCommentDownvotes)
    const recentKarmaInfoNewCommentVotes = calculateRecentKarmaInfo("authorId", commentDownVotes)
    const rateLimit = createCommentRateLimit({lastMonthKarmaThreshold: -1})
    const user1 = createUserKarmaInfo()
    
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfoOldCommentVotes)).toEqual(false)
    expect(shouldRateLimitApply(user1, rateLimit, recentKarmaInfoNewCommentVotes)).toEqual(true)
  })
})
