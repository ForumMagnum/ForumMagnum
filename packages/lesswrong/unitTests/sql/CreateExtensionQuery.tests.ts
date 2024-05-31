import CreateExtensionQuery from "@/server/sql/CreateExtensionQuery";

describe("CreateExtensionQuery", () => {
  it("can build a create extension query", () => {
    const query = new CreateExtensionQuery("vector");
    const {sql, args} = query.compile();
    expect(sql).toBe(`CREATE EXTENSION IF NOT EXISTS "vector" CASCADE`);
    expect(args).toStrictEqual([]);
  });
});
