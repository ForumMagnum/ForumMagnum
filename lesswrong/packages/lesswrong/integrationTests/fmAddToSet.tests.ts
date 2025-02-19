import "./integrationTestSetup";
import { getSqlClientOrThrow } from "../server/sql/sqlClient";

describe("fm_add_to_set", () => {
  describe("Native Postgres sets", () => {
    it("can add to a native set", async () => {
      const db = getSqlClientOrThrow();
      const {result} = await db.one(`SELECT fm_add_to_set(
        '{1, 2, 3}'::INTEGER[],
        4
      ) as result;`);
      expect(result).toStrictEqual([1, 2, 3, 4]);
    });
    it("doesn't add duplicate elements to a native set", async () => {
      const db = getSqlClientOrThrow();
      const {result} = await db.one(`SELECT fm_add_to_set(
        '{1, 2, 3}'::INTEGER[],
        3
      ) as result;`);
      expect(result).toStrictEqual([1, 2, 3]);
    });
    it("can create an array if the base array is null", async () => {
      const db = getSqlClientOrThrow();
      const {result} = await db.one(`SELECT fm_add_to_set(
        null::INTEGER[],
        1
      ) as result;`);
      expect(result).toStrictEqual([1]);
    });
  });
  describe("JSON sets", () => {
    it("can add to a JSON set", async () => {
      const db = getSqlClientOrThrow();
      const {result} = await db.one(`SELECT fm_add_to_set(
        '{"a": {"b": [1,2,3]}, "c": 10}'::JSONB,
        '{a, b}'::TEXT[],
        4
      ) as result;`);
      expect(result).toStrictEqual({
        a: {
          b: [1, 2, 3, 4],
        },
        c: 10,
      });
    });
    it("doesn't add duplicate elements to a JSON set", async () => {
      const db = getSqlClientOrThrow();
      const {result} = await db.one(`SELECT fm_add_to_set(
        '{"a": {"b": [1,2,3]}}'::JSONB,
        '{a, b}'::TEXT[],
        3
      ) as result;`);
      expect(result).toStrictEqual({
        a: {
          b: [1, 2, 3],
        },
      });
    });
    it("can create an empty object if the base value is null", async () => {
      const db = getSqlClientOrThrow();
      const {result} = await db.one(`SELECT fm_add_to_set(
        NULL::JSONB,
        '{a, b}'::TEXT[],
        1
      ) as result;`);
      expect(result).toStrictEqual({
        a: {
          b: [1],
        },
      });
    });
    it("can create sub-objects when encountering a null", async () => {
      const db = getSqlClientOrThrow();
      const {result} = await db.one(`SELECT fm_add_to_set(
        '{"a": null}'::JSONB,
        '{a, b}'::TEXT[],
        1
      ) as result;`);
      expect(result).toStrictEqual({
        a: {
          b: [1],
        },
      });
    });
  });
});
