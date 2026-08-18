import "../integrationTestSetup";
import { runQuery } from '../../server/vulcan-lib/query';
import {
  createDummyUser,
  createDummyPost,
  createDummyUserRateLimit,
  catchGraphQLErrors,
  assertIsPermissionsFlavoredError,
  waitUntilPgQueriesFinished,
} from '../utils'
import Posts from '../../server/collections/posts/collection';
import UserRateLimits from '../../server/collections/userRateLimits/collection';
import moment from 'moment';
import { computeContextFromUser } from '../../server/vulcan-lib/apollo-server/context';
import { rateLimitDateWhenUserNextAbleToPost } from '../../server/rateLimitUtils';

const CreateRateLimitedPostMutation = `
  mutation CreateRateLimitedPost($data: CreatePostDataInput!) {
    createPost(data: $data) {
      data {
        _id
      }
    }
  }
`;

function createRateLimitedPost(user: DbUser, title: string) {
  return runQuery(CreateRateLimitedPostMutation, {
    data: {
      title,
      contents: {
        originalContents: {
          type: 'markdown',
          data: 'Test post contents',
        },
      },
    },
  }, {currentUser: user});
}

describe('moderator-applied overlapping user post rate limits', () => {
  const graphQLErrors = catchGraphQLErrors();

  it('enforces all active limits and falls back to the continuing limit when the zero-action limit ends', async () => {
    const user = await createDummyUser();
    const zeroActionRateLimitEndsAt = moment().add(4, 'weeks').toDate();
    const zeroActionRateLimit = await createDummyUserRateLimit(user, {
      userId: user._id,
      type: 'allPosts',
      intervalUnit: 'weeks',
      intervalLength: 1,
      actionsPerInterval: 0,
      endedAt: zeroActionRateLimitEndsAt,
    });
    await createDummyUserRateLimit(user, {
      userId: user._id,
      type: 'allPosts',
      intervalUnit: 'weeks',
      intervalLength: 4,
      actionsPerInterval: 1,
      endedAt: moment().add(16, 'weeks').toDate(),
    });

    const context = await computeContextFromUser({user, isSSR: false});
    const activeRateLimit = await rateLimitDateWhenUserNextAbleToPost(user, context);
    expect(activeRateLimit?.nextEligible).toEqual(zeroActionRateLimitEndsAt);
    await expect(createRateLimitedPost(user, 'Blocked by zero-action rate limit')).rejects.toThrow('Rate limit: You cannot post');

    await UserRateLimits.rawUpdateOne(zeroActionRateLimit._id, {
      $set: {endedAt: moment().subtract(1, 'second').toDate()},
    });

    await createRateLimitedPost(user, 'Allowed after zero-action rate limit');
    await expect(createRateLimitedPost(user, 'Blocked by continuing rate limit')).rejects.toThrow('Rate limit: You cannot post');
    graphQLErrors.getErrors();
  });
});

describe('PostsEdit', () => {
  let graphQLerrors = catchGraphQLErrors();
  
  it("succeeds when owner of post edits title", async () => {
    const user = await createDummyUser()
    const post = await createDummyPost(user)

    const newTitle = "New Test Title"

    const query = `
      mutation PostsEdit {
        updatePost(selector: {_id:"${post._id}"}, data:{title:"${newTitle}"}) {
          data {
            title
          }
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user})
    const expectedOutput = { data: { updatePost: { data: { title: `${newTitle}`} } } }
    return (response as any).should.eventually.deep.equal(expectedOutput);
  });
  it("fails when non-owner edits title", async () => {
    const user = await createDummyUser()
    const user2 = await createDummyUser()
    const post = await createDummyPost(user)

    const newTitle = "New Test Title"

    const query = `
      mutation PostsEdit {
        updatePost(selector: {_id:"${post._id}"}, data:{title:"${newTitle}"}) {
          data {
            title
          }
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user2})
    await (response as any).should.be.rejected;
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
});

describe('Posts RSS Views', () => {
  it("only shows curated posts in curatedRss view", async () => {
    const user = await createDummyUser();
    const frontpagePost1 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const frontpagePost2 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const frontpagePost3 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const curatedPost1 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const curatedPost2 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const curatedPost3 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    await waitUntilPgQueriesFinished();

    const query = `
      query {
        posts(input:{terms:{view: "curatedRss"}}) {
          results {
            _id
          }
        }
      }
    `;

    const { data: { posts: {results: posts} } } = await runQuery(query,{},{currentUser:user}) as any;
    (posts.map((post: any) => post._id) as any).should.not.include(frontpagePost1._id);
    (posts.map((post: any) => post._id) as any).should.not.include(frontpagePost2._id);
    (posts.map((post: any) => post._id) as any).should.not.include(frontpagePost3._id);
    (posts.map((post: any) => post._id) as any).should.include(curatedPost1._id);
    (posts.map((post: any) => post._id) as any).should.include(curatedPost2._id);
    (posts.map((post: any) => post._id) as any).should.include(curatedPost3._id);
  });
  it("returns curated posts in descending order of them being curated", async () => {
    const user = await createDummyUser();
    const now = new Date();
    const yesterday = new Date(new Date().getTime()-(1*24*60*60*1000));
    const twoDaysAgo = new Date(new Date().getTime()-(2*24*60*60*1000));
    const curatedPost1 = await createDummyPost(user, {curatedDate: now, frontpageDate: new Date(), baseScore: 10});
    const curatedPost2 = await createDummyPost(user, {curatedDate: yesterday, frontpageDate: new Date(), baseScore: 10});
    const curatedPost3 = await createDummyPost(user, {curatedDate: twoDaysAgo, frontpageDate: new Date(), baseScore: 10});

    const query = `
      query {
        posts(input:{terms:{view: "curatedRss"}}) {
          results {
            _id
          }
        }
      }
    `;

    const { data: { posts: {results: posts} } } = await runQuery(query,{},{currentUser:user}) as any
    const idList = posts.map((post: any) => post._id);
    (idList.indexOf(curatedPost1._id) as any).should.be.below(idList.indexOf(curatedPost2._id));
    (idList.indexOf(curatedPost2._id) as any).should.be.below(idList.indexOf(curatedPost3._id));
  });
  it("only shows frontpage posts in frontpageRss view", async () => {
    const user = await createDummyUser();
    const frontpagePost1 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const frontpagePost2 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const frontpagePost3 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const personalPost1 = await createDummyPost(user, {baseScore: 10});
    const personalPost2 = await createDummyPost(user, {baseScore: 10});
    const personalPost3 = await createDummyPost(user, {baseScore: 10});

    // TODO: HACK - one of the callbacks seems to set normalPost.frontpageDate, but we want it to be null
    await Posts.rawUpdateMany(
      {_id: {$in: [personalPost1._id, personalPost2._id, personalPost3._id]}},
      {$set: {frontpageDate: null}},
    );

    const query = `
      query {
        posts(input:{terms:{view: "frontpageRss"}}) {
          results {
            _id
          }
        }
      }
    `;

    const { data: { posts: {results: posts} } } = await runQuery(query,{},{currentUser:user}) as any;
    (posts.map((post: any) => post._id) as any).should.include(frontpagePost1._id);
    (posts.map((post: any) => post._id) as any).should.include(frontpagePost2._id);
    (posts.map((post: any) => post._id) as any).should.include(frontpagePost3._id);
    (posts.map((post: any) => post._id) as any).should.not.include(personalPost1._id);
    (posts.map((post: any) => post._id) as any).should.not.include(personalPost2._id);
    (posts.map((post: any) => post._id) as any).should.not.include(personalPost3._id);
  });
})
