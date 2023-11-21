import SqlFragment from "../../lib/sql/SqlFragment";
import "../../lib/sql/tests/testHelpers";

describe("SqlFragment", () => {
  it("can parse simple fields", () => {
    const fragment = new SqlFragment(`
      fragment TestFragment on TestCollection {
        _id
        a # with a comment
      }
    `);
    expect(fragment.getName()).toBe("TestFragment");
    expect(fragment.getCollection().collectionName).toBe("TestCollection");
    expect(fragment.getEntries()).toStrictEqual([
      {type: "field", name: "_id"},
      {type: "field", name: "a"},
    ]);
  });
});
