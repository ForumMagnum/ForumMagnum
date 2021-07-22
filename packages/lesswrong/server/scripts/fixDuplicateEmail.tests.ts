import { mergeSingleUser, classifyDuplicateUser, MergeType } from './fixDuplicateEmail'
import { testStartup } from "../../testing/testMain";

testStartup();

describe("classifyDuplicateUser", () => {
  it("should classify a user as empty", () => {
    const user = { '_id': '1', posts: [], comments: [] }
    expect(classifyDuplicateUser(user)).toEqual({ user, classification: MergeType.RemoveAccount })
  })
  it("should classify a user as not empty", () => {
    const user = { '_id': '1', posts: [{ '_id': '1' }], comments: [] }
    expect(classifyDuplicateUser(user)).toEqual({ user, classification: MergeType.KeepAccount })
  })
})

describe("mergeSingleUser", () => {
  it("handles only one good user", () => {
    const userList = [
      { '_id': '1', posts: [], comments: [] },
      { '_id': '2', posts: [{ '_id': '1' }], comments: [] },
      { '_id': '3', posts: [], comments: [] }]
    const expected = {
      destinationId: '2',
      sourceIds: ['1', '3'],
      justification: 'only one nonempty account'
    }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });


  it("handles no good users", async () => {
    const userList = [
      { '_id': '1', posts: [], comments: [] },
      { '_id': '2', posts: [], comments: [] },
      { '_id': '3', posts: [], comments: [] }]
    const expected = {
      destinationId: '1',
      sourceIds: ['2', '3'],
      justification: 'all empty accounts'
    }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });

  it("handles good users not sharing a name", async () => {
    const userList = [
      { '_id': '1', posts: [{ '_id': '1' }], comments: [], matches: { username: "test" } },
      { '_id': '2', posts: [], comments: [{ '_id': '1' }], matches: { username: "test" } },
      { '_id': '3', posts: [], comments: [{ '_id': '1' }], matches: { username: "t" } },
      { '_id': '4', posts: [], comments: [] }]

    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual('ManualNeeded');
  });

  it("handles good users sharing a name", async () => {
    const userList = [
      { '_id': '1', posts: [{ '_id': '1' }], comments: [], matches: { username: "test" } },
      { '_id': '2', posts: [], comments: [{ '_id': '1' }], matches: { username: "test" } },
      { '_id': '3', posts: [], comments: [] }]
    const expected = {
      destinationId: '1',
      sourceIds: ['2', '3'],
      justification: 'all accounts share the same name'
    }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });
});
