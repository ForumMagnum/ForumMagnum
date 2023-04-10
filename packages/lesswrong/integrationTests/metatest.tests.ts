import "./integrationTestSetup";
import { createDummyUser, createDummyPost } from './utils'

describe('Utils', () => {
  describe('createDummyUser', () => {
    it('generates appropriate email', async () => {
      const user = await createDummyUser();
      (user.email as any).should.equal(user.username + "@test.lesserwrong.com")
    });
    it('autogenerates username', async () => {
      const user = await createDummyUser();
      (user.username as any).should.not.equal(undefined)
    });
    it("user is in no groups by default", async () => {
      const user = await createDummyUser();
      expect(user.groups).toBe(null);
    });
    it("user can be added to a group", async () => {
      const testGroups = ['randomGroupName']
      const user = await createDummyUser({groups:testGroups});
      (user.groups as any).should.deep.equal(testGroups)
    });
  });
  describe('createDummyPost', () => {
    it('generates a default title and slug', async () => {
      const post = await createDummyPost();
      (post.title.toLowerCase() as any).should.equal(post.slug)
    });
  });

  // describe('clearDatabase', () => {
  //   it('clears database', async () => {
  //     await clearDatabase()
  //     const user = await createDummyUser()
  //     await createDummyPost(user._id)
  //     Posts.find().fetch().length.should.equal(1)
  //     Users.find().fetch().length.should.equal(1)
  //     await clearDatabase()
  //     Posts.find().fetch().length.should.equal(0)
  //     Users.find().fetch().length.should.equal(0)
  //   });
  // });
})
