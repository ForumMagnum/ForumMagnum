import ProjectionContext from "@/server/sql/ProjectionContext";
import PgCollection from "@/server/sql/PgCollection";
import { TestCollection as RawTestCollection } from "@/server/sql/tests/testHelpers";

describe("ProjectionContext", () => {
  const TestCollection = RawTestCollection as PgCollection<CollectionNameString>;
  it("can set current user for logged-out users", () => {
    const context = new ProjectionContext(TestCollection);
    context.setCurrentUser(null);
    expect(context.getJoins()[0].table).toBe("Users");
    expect(context.getArgs()[0]).toBe(null);
  });
  it("can set current user for logged-in users", () => {
    const context = new ProjectionContext(TestCollection);
    const user = {_id: "test-user-id"} as DbUser;
    context.setCurrentUser(user);
    expect(context.getJoins()[0].table).toBe("Users");
    expect(context.getArgs()[0]).toBe("test-user-id");
  });
  it("prepends primary prefix to fields", () => {
    const context = new ProjectionContext(TestCollection);
    expect(context.field("test")).toBe(`"t"."test"`);
  });
  it("prepends aggregate prefix to fields", () => {
    const context = new ProjectionContext(TestCollection, {
      prefix: "p",
      argOffset: 0,
    });
    expect(context.field("test")).toBe(`'test', "p"."test"`);
  });
  it("prepends current user prefix to fields", () => {
    const context = new ProjectionContext(TestCollection);
    expect(context.currentUserField("_id")).toBe(`"currentUser"."_id"`);
  });
  it("detects duplicate joins", () => {
    const context = new ProjectionContext(TestCollection);
    const join1: SqlResolverJoin<CollectionNameString> = {
      table: "TestTable2" as CollectionNameString,
      type: "left",
      on: {
        _id: "_id",
      },
      resolver: () => "",
    };
    const join2: SqlResolverJoin<CollectionNameString> = {
      table: "TestTable2" as CollectionNameString,
      type: "left",
      on: {
        userId: "userId",
      } as AnyBecauseHard,
      resolver: () => "",
    };
    expect(context.getJoins()).toHaveLength(0);
    context.addJoin(join1);
    expect(context.getJoins()).toHaveLength(1);
    context.addJoin(join2);
    expect(context.getJoins()).toHaveLength(2);
    context.addJoin(join1);
    expect(context.getJoins()).toHaveLength(2);
  });
  it("increments argument number", () => {
    const context = new ProjectionContext(TestCollection);
    expect(context.addArg(3)).toBe("$1");
    expect(context.addArg(null)).toBe("$2");
    expect(context.addArg("test")).toBe("$3");
  });
  it("increments argument number with offset", () => {
    const context = new ProjectionContext(TestCollection, {
      prefix: "p",
      argOffset: 5,
    });
    expect(context.addArg(3)).toBe("$6");
    expect(context.addArg(null)).toBe("$7");
    expect(context.addArg("test")).toBe("$8");
  });
});
