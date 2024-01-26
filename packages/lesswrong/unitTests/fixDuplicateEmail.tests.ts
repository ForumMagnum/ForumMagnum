import { mergeSingleUser, classifyDuplicateUser, MergeType } from '../server/scripts/fixDuplicateEmail'

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
      type: 'RunnableMergeAction',
      destinationId: '2',
      sourceIds: ['1', '3'],
      justification: 'only one nonempty account'
    }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });
  
  it("handles only one good user who doesn't have an email", () => {
    const userList = [
      { '_id': '1', posts: [], comments: [], matches: { arrayEmail: ['foo'] }  },
      { '_id': '2', posts: [{ '_id': '1' }], comments: [] },
      { '_id': '3', posts: [], comments: [] }]
    const expected = {
      type: 'ManualMergeAction',
      sourceIds: ['1', '2', '3']
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
      type: 'RunnableMergeAction',
      destinationId: '1',
      sourceIds: ['2', '3'],
      justification: 'all empty accounts'
    }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });
  
  it("handles no good users but one has an email", async () => {
    const userList = [
      { '_id': '1', posts: [], comments: [] },
      { '_id': '2', posts: [], comments: [], matches: { arrayEmail: ['foo'] }  },
      { '_id': '3', posts: [], comments: [] }]
    const expected = {
      type: 'RunnableMergeAction',
      destinationId: '2',
      sourceIds: ['1', '3'],
      justification: 'all empty accounts'
    }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });

  it("handles good users not sharing a name", async () => {
    const userList = [
      { '_id': '1', posts: [{ '_id': '1' }], comments: [], matches: { displayName: "test" } },
      { '_id': '2', posts: [], comments: [{ '_id': '1' }], matches: { displayName: "test" } },
      { '_id': '3', posts: [], comments: [{ '_id': '1' }], matches: { displayName: "t" } },
      { '_id': '4', posts: [], comments: [] }]
    const expected = {
        type: 'ManualMergeAction',
        sourceIds: ['1', '2', '3', '4'],
      }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });

  it("handles good users sharing a name", async () => {
    const userList = [
      { '_id': '1', posts: [{ '_id': '1' }], comments: [], matches: { displayName: "Test Name" } },
      { '_id': '2', posts: [], comments: [{ '_id': '1' }], matches: { displayName: "test_name" } },
      { '_id': '3', posts: [], comments: [] }]
    const expected = {
      type: 'RunnableMergeAction',
      destinationId: '1',
      sourceIds: ['2', '3'],
      justification: 'all accounts share the same name'
    }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });

  it("handles finding the one with a email array", async () => {
    const userList = [
      { '_id': '1', posts: [{ '_id': '1' }], comments: [], matches: { displayName: "Test Name" } },
      { '_id': '2', posts: [], comments: [{ '_id': '1' }], matches: { displayName: "test_name", arrayEmail: ['foo'] } },
      { '_id': '3', posts: [], comments: [] }]
    const expected = {
      type: 'RunnableMergeAction',
      destinationId: '2',
      sourceIds: ['1', '3'],
      justification: 'all accounts share the same name'
    }
    const results = mergeSingleUser(userList)
    expect(results).toStrictEqual(expected);
  });
});
