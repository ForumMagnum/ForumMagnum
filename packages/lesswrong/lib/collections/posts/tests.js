import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery, waitUntilCallbacksFinished, removeCallback, addCallback } from 'meteor/vulcan:core';
import moment from 'moment-timezone';
import {
  createDummyUser,
  createDummyPost,
  catchGraphQLErrors,
  assertIsPermissionsFlavoredError,
  clearDatabase
  // cleanUpPosts
} from '../../../testing/utils.js'
import { LWPostsNewUpvoteOwnPost } from './callbacks'

chai.should();
chai.use(chaiAsPromised);

describe('PostsEdit', async () => {
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
    return response.should.eventually.deep.equal(expectedOutput);
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
    const expectedError = '{"id":"app.operation_not_allowed","value":"check"}'
    await response.should.be.rejectedWith(expectedError);
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
});

describe('Posts RSS Views', async () => {
  it("only shows curated posts in curated-rss view", async () => {
    const user = await createDummyUser();
    const frontpagePost1 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const frontpagePost2 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const frontpagePost3 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const curatedPost1 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const curatedPost2 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const curatedPost3 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});

    const query = `
      query {
        posts(input:{terms:{view: "curated-rss"}}) {
          results {
            _id
          }
        }
      }
    `;

    const { data: { posts: {results: posts} } } = await runQuery(query,{},user)
    _.pluck(posts, '_id').should.not.include(frontpagePost1._id)
    _.pluck(posts, '_id').should.not.include(frontpagePost2._id)
    _.pluck(posts, '_id').should.not.include(frontpagePost3._id)
    _.pluck(posts, '_id').should.include(curatedPost1._id)
    _.pluck(posts, '_id').should.include(curatedPost2._id)
    _.pluck(posts, '_id').should.include(curatedPost3._id)
  });
  it("returns curated posts in descending order of them being curated", async () => {
    const user = await createDummyUser();
    const now = new Date();
    await waitUntilCallbacksFinished()
    const yesterday = new Date(new Date().getTime()-(1*24*60*60*1000));
    const twoDaysAgo = new Date(new Date().getTime()-(2*24*60*60*1000));
    const curatedPost1 = await createDummyPost(user, {curatedDate: now, frontpageDate: new Date(), baseScore: 10});
    const curatedPost2 = await createDummyPost(user, {curatedDate: yesterday, frontpageDate: new Date(), baseScore: 10});
    const curatedPost3 = await createDummyPost(user, {curatedDate: twoDaysAgo, frontpageDate: new Date(), baseScore: 10});
    await waitUntilCallbacksFinished()

    const query = `
      query {
        posts(input:{terms:{view: "curated-rss"}}) {
          results {
            _id
          }
        }
      }
    `;

    const { data: { posts: {results: posts} } } = await runQuery(query,{},user)
    const idList = _.pluck(posts, '_id');
    idList.indexOf(curatedPost1._id).should.be.below(idList.indexOf(curatedPost2._id));
    idList.indexOf(curatedPost2._id).should.be.below(idList.indexOf(curatedPost3._id));
  });
  it("only shows frontpage posts in frontpage-rss view", async () => {
    const user = await createDummyUser();
    await waitUntilCallbacksFinished()
    const frontpagePost1 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    console.log('frontpagePost1', frontpagePost1)
    const frontpagePost2 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const frontpagePost3 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const personalPost1 = await createDummyPost(user, {baseScore: 10});
    const personalPost2 = await createDummyPost(user, {baseScore: 10});
    const personalPost3 = await createDummyPost(user, {baseScore: 10});
    await waitUntilCallbacksFinished()

    const query = `
      query {
        posts(input:{terms:{view: "frontpage-rss"}}) {
          results {
            _id
          }
        }
      }
    `;

    const { data: { posts: {results: posts} } } = await runQuery(query,{},user)
    _.pluck(posts, '_id').should.include(frontpagePost1._id)
    _.pluck(posts, '_id').should.include(frontpagePost2._id)
    _.pluck(posts, '_id').should.include(frontpagePost3._id)
    _.pluck(posts, '_id').should.not.include(personalPost1._id)
    _.pluck(posts, '_id').should.not.include(personalPost2._id)
    _.pluck(posts, '_id').should.not.include(personalPost3._id)
  });
})

// TODO; remove only
// TODO; this may need to be changed, as there's more logic on the frontend now // edit or not
describe.only('Posts timeframe resolver', () => {
  // createDummyPost creates a post with baseScore, but LWPostsNewUpvoteOwnPost
  // overwrites it.
  // TODO: The right way to do this is probably remove the callback in
  // createDummy if baseScore is present in the input post
  before(() => {
    console.log('before removing ====')
    removeCallback('posts.new.after', 'LWPostsNewUpvoteOwnPost')
  })
  after(() => {
    console.log('after adding ====')
    addCallback('posts.new.after', LWPostsNewUpvoteOwnPost)
  })
  afterEach(clearDatabase)

  it('smokes month', async () => {
    const user = await createDummyUser()
    await waitUntilCallbacksFinished()

    // console.log('finished creating user', user)

    const testData = [
      {post: await createDummyPost(user, {postedAt: moment().toDate(), baseScore: 112}),
       included: true, bucketIndex: 0},
      {post: await createDummyPost(user, {postedAt: moment().toDate(), baseScore: 111}),
       included: true, bucketIndex: 0},
      {post: await createDummyPost(user, {postedAt: moment().toDate(), baseScore: 110}),
       included: false},
      {post: await createDummyPost(user, {postedAt: moment().subtract(1, 'month').toDate(), baseScore: 112}),
       included: true, bucketIndex: 1},
      {post: await createDummyPost(user, {postedAt: moment().subtract(1, 'month').toDate(), baseScore: 111}),
       included: true, bucketIndex: 1},
      {post: await createDummyPost(user, {postedAt: moment().subtract(1, 'month').toDate(), baseScore: 110}),
       included: false},
      {post: await createDummyPost(user, {postedAt: moment().subtract(2, 'month').toDate(), baseScore: 112}),
       included: false},
    ]
    await waitUntilCallbacksFinished()

    // console.log('testData', testData)
    // console.log('/testData')

    // TODO; real arguments
    const query = `
      query PostsByTimeframeQuery {
        PostsByTimeframe(foo: 1) {
          _id
          posts {
            _id
            title
            baseScore
          }
        }
      }
    `
    console.log('hello 1')
    // { posts: {results: posts} } //
    const { data: { PostsByTimeframe: result } } = await runQuery(query, {}, user)
    console.log('hello 2')

    console.log('test result full', result)

    for (const {included, bucketIndex, post} of testData) {
      console.log('included', included)
      console.log('post info', _.pick(post, ['_id', 'postedAt', 'baseScore']))
      console.log('bucketIndex', bucketIndex)
      if (included) {
        const bucket = result[bucketIndex]
        console.log('bucket', bucket)
        const bucketIds = _.pluck(bucket.posts, '_id')
        console.log('bucketIds', bucketIds)
        bucketIds.should.include(post._id)
      } else {
        for (const bucket of result) {
          console.log('bucket', bucket)
          const bucketIds = _.pluck(bucket.posts, '_id')
          console.log('bucketIds', bucketIds)
          bucketIds.should.not.include(post._id)
        }
      }
      console.log('single post checked')
    }
    console.log('exiting////')
    // // TODO; doesn't clean up after itself
  })
})
