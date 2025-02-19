import {
  setSqlClient,
  getSqlClient,
  getSqlClientOrThrow,
  closeSqlClient,
} from "@/server/sql/sqlClient";

const createMockClient = (): SqlClient => {
  const client = {
    $pool: {
      end: jest.fn(),
    },
  };
  return client as unknown as SqlClient;
}

describe("sqlClient", () => {
  it("can get, set and close client", async () => {
    const client = createMockClient();

    expect(getSqlClient()).toBe(null);
    expect(getSqlClientOrThrow).toThrowError();

    setSqlClient(client);
    expect(getSqlClient()).toBe(client);
    expect(getSqlClientOrThrow()).toBe(client);

    expect(client.$pool.end).not.toHaveBeenCalled();
    await closeSqlClient(client);
    expect(client.$pool.end).toHaveBeenCalled();
    expect(getSqlClient()).toBe(null);
    expect(getSqlClientOrThrow).toThrowError();
  });
});
