import TableIndex from "@/server/sql/TableIndex";
import { DbTestObject } from "@/server/sql/tests/testHelpers";

describe("TableIndex", () => {
  it("can create table index with given fields", () => {
    const index = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1});
    expect(index.getFields()).toEqual(["a", "b"]);
  });
  it("can auto-generate index name", () => {
    const index = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1});
    expect(index.getName()).toEqual("idx_testTable_a_b");
  });
  it("can provide a custom index name", () => {
    const index = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1}, {name: "my_index"});
    expect(index.getName()).toEqual("idx_my_index");
  });
  it("can retrieve Mongo-compatible index details", () => {
    const index = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1}, {name: "my_index"});
    expect(index.getDetails()).toStrictEqual({
      v: 2,
      key: {a: 1, b: 1},
      name: "my_index",
    });
  });
  it("indexes have no partial filter expression by default", () => {
    const index = new TableIndex<DbTestObject>("testTable", {a: 1});
    expect(index.getPartialFilterExpression()).toBe(undefined);
  });
  it("indexes can have a partial filter expression", () => {
    const index = new TableIndex<DbTestObject>("testTable", {a: 1}, {partialFilterExpression: {a: {$exists: true}}});
    expect(index.getPartialFilterExpression()).toStrictEqual({a: {$exists: true}});
  });
  it("indexes are not unique by default", () => {
    const index = new TableIndex<DbTestObject>("testTable", {a: 1});
    expect(index.isUnique()).toBe(false);
  });
  it("indexes can be unique", () => {
    const index = new TableIndex<DbTestObject>("testTable", {a: 1}, {unique: true});
    expect(index.isUnique()).toStrictEqual(true);
  });
  it("indexes can be compared for equality", () => {
    const index1 = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1});
    const index2 = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1});
    const index3 = new TableIndex<DbTestObject>("testTable", {a: 1});
    const index4 = new TableIndex<DbTestObject>("testTable", {a: 1, c: 1});
    const index5 = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1, c: 1});
    const index6 = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1}, {unique: true});
    const index7 = new TableIndex<DbTestObject>("testTable", {a: 1, b: 1}, {partialFilterExpression: {a:1}});
    expect(index1.equalsTableIndex(index2)).toBe(true);
    expect(index2.equalsTableIndex(index1)).toBe(true);
    expect(index1.equalsTableIndex(index3)).toBe(false);
    expect(index1.equalsTableIndex(index4)).toBe(false);
    expect(index1.equalsTableIndex(index5)).toBe(false);
    expect(index1.equalsTableIndex(index6)).toBe(false);
    expect(index1.equalsTableIndex(index7)).toBe(false);
  });
  it("indexes are case-sensitive by default", () => {
    const index = new TableIndex<DbTestObject>("testTable", {b: 1});
    expect(index.isCaseInsensitive()).toStrictEqual(false);
  });
  it("indexes can be case-insensitive", () => {
    const index = new TableIndex<DbTestObject>(
      "testTable",
      {b: 1},
      {collation: {locale: "en", strength: 2}},
    );
    expect(index.isCaseInsensitive()).toStrictEqual(true);
  });
});
