import { container } from "tsyringe";
import { setSqlClient } from "../lib/sql/sqlClient";
import PostRelationsRepo from "../lib/repos/PostRelationsRepo";

describe("container", () => {
  it("can resolve SQL connection", () => {
    const db = {} as unknown as SqlClient;
    setSqlClient(db);
    const resolved = container.resolve("db");
    expect(resolved).toBe(db);
  });
  it("can explicitely resolve Repos", () => {
    const resolved = container.resolve(PostRelationsRepo);
    expect(resolved).toBeInstanceOf(PostRelationsRepo);
  });
  it("can implicitely resolve Repos", () => {
    const resolved = PostRelationsRepo.resolve();
    expect(resolved).toBeInstanceOf(PostRelationsRepo);
  });
});
