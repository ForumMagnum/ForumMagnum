import ProjectionContext from "../../lib/sql/ProjectionContext";
import { testTable } from "../../lib/sql/tests/testHelpers";

describe("ProjectionContext", () => {
  it("can set current user for logged-out users", () => {
    const context = new ProjectionContext(testTable);
    context.setCurrentUser(null);
    expect(context.getJoins()[0].table).toBe("Users");
    expect(context.getArgs()[0]).toBe(null);
  });
  it("can set current user for logged-in users", () => {
    const context = new ProjectionContext(testTable);
    const user = {_id: "test-user-id"} as DbUser;
    context.setCurrentUser(user);
    expect(context.getJoins()[0].table).toBe("Users");
    expect(context.getArgs()[0]).toBe("test-user-id");
  });
  it("prepends primary prefix to fields", () => {
    const context = new ProjectionContext(testTable);
    expect(context.field("test")).toBe(`t."test"`);
  });
  it("prepends current user prefix to fields", () => {
    const context = new ProjectionContext(testTable);
    expect(context.currentUserField("_id")).toBe(`"currentUser"."_id"`);
  });
  it("detects duplicate joins", () => {
    const context = new ProjectionContext(testTable);
    const join1: SqlResolverJoin = {
      table: "TestTable2",
      type: "left",
      on: {
        _id: "_id",
      },
      resolver: () => "",
    };
    const join2: SqlResolverJoin = {
      table: "TestTable2",
      type: "left",
      on: {
        userId: "userId",
      },
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
    const context = new ProjectionContext(testTable);
    expect(context.addArg(3)).toBe("$1");
    expect(context.addArg(null)).toBe("$2");
    expect(context.addArg("test")).toBe("$3");
  });
});
