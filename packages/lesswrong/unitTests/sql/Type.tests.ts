import {
  StringType,
  BoolType,
  IntType,
  FloatType,
  DateType,
  JsonType,
  ArrayType,
  IdType,
  NotNullType,
  DefaultValueType,
  UnknownType,
  VectorType,
} from "@/server/sql/Type";
import { Posts } from "../../server/collections/posts/collection";

describe("SQL Type", () => {
  describe("StringType", () => {
    it("Can have unlimited length", () => {
      expect(new StringType().toString()).toBe("TEXT");
    });
    it("Can have a max length", () => {
      expect(new StringType(10).toString()).toBe("VARCHAR(10)");
    });
    it("Can be coalesced for index conflicts", () => {
      expect(new StringType().getIndexCoalesceValue()).toBe("''");
    });
    it("Is scalar", () => {
      expect(new StringType().isArray()).toBe(false);
    });
    it("Is concrete", () => {
      const type = new StringType();
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("BoolType", () => {
    it("Is Postgres BOOL", () => {
      expect(new BoolType().toString()).toBe("BOOL");
    });
    it("Is scalar", () => {
      expect(new BoolType().isArray()).toBe(false);
    });
    it("Is concrete", () => {
      const type = new BoolType();
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("IntType", () => {
    it("Is Postgres INTEGER", () => {
      expect(new IntType().toString()).toBe("INTEGER");
    });
    it("Is scalar", () => {
      expect(new IntType().isArray()).toBe(false);
    });
    it("Is concrete", () => {
      const type = new IntType();
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("FloatType", () => {
    it("Is Postgres DOUBLE PRECISION", () => {
      expect(new FloatType().toString()).toBe("DOUBLE PRECISION");
    });
    it("Is scalar", () => {
      expect(new FloatType().isArray()).toBe(false);
    });
    it("Is concrete", () => {
      const type = new FloatType();
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("DateType", () => {
    it("Is Postgres TIMESTAMPTZ", () => {
      expect(new DateType().toString()).toBe("TIMESTAMPTZ");
    });
    it("Is scalar", () => {
      expect(new DateType().isArray()).toBe(false);
    });
    it("Is concrete", () => {
      const type = new DateType();
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("JsonType", () => {
    it("Is Postgres JSONB", () => {
      expect(new JsonType().toString()).toBe("JSONB");
    });
    it("Is scalar", () => {
      expect(new JsonType().isArray()).toBe(false);
    });
    it("Is concrete", () => {
      const type = new JsonType();
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("IdType", () => {
    it("Is Postgres string of length 27", () => {
      const pgType = new IdType().toString();
      expect(pgType).toBe(`VARCHAR(27)`);
    });
    it("Is scalar", () => {
      expect(new IdType().isArray()).toBe(false);
    });
    it("Is concrete", () => {
      const type = new IdType();
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("ArrayType", () => {
    it("Is Postgres array", () => {
      expect(new ArrayType(new StringType()).toString()).toBe("TEXT[]");
    });
    it("Is an array", () => {
      expect(new ArrayType(new StringType()).isArray()).toBe(true);
    });
    it("Is concrete", () => {
      const type = new ArrayType(new StringType());
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("VectorType", () => {
    it("Is Postgres vector", () => {
      expect(new VectorType(1234).toString()).toBe("VECTOR(1234)");
    });
    it("Is scalar", () => {
      expect(new VectorType(1234).isArray()).toBe(false);
    });
    it("Is concrete", () => {
      const type = new VectorType(1234);
      expect(type.toConcrete()).toBe(type);
    });
  });
  describe("UnknownType", () => {
    it("Cannot be converted to a string", () => {
      expect(() => new UnknownType().toString()).toThrowError();
    });
  });
  describe("NotNullType", () => {
    it("Is Postgres NOT NULL", () => {
      expect(new NotNullType(new StringType()).toString()).toBe("TEXT NOT NULL");
    });
    it("Is scalar", () => {
      expect(new NotNullType(new StringType()).isArray()).toBe(false);
    });
    it("Is not concrete", () => {
      const concreteType = new StringType();
      const type = new NotNullType(concreteType);
      expect(type.toConcrete()).toBe(concreteType);
    });
  });
  describe("DefaultValueType", () => {
    it("Is Postgres DEFAULT", () => {
      expect(new DefaultValueType(new StringType(), "test").toString()).toBe("TEXT DEFAULT 'test'");
    });
    it("Is scalar", () => {
      expect(new DefaultValueType(new StringType(), "test").isArray()).toBe(false);
    });
    it("Is not concrete", () => {
      const concreteType = new StringType();
      const type = new DefaultValueType(concreteType, "test");
      expect(type.toConcrete()).toBe(concreteType);
    });
    describe("Converts values to strings", () => {
      it("strings", () => {
        expect(new DefaultValueType(new StringType(), "test").toString()).toBe("TEXT DEFAULT 'test'");
      });
      it("bools", () => {
        expect(new DefaultValueType(new BoolType(), true).toString()).toBe("BOOL DEFAULT true");
      });
      it("ints", () => {
        expect(new DefaultValueType(new IntType(), 3).toString()).toBe("INTEGER DEFAULT 3");
      });
      it("floats", () => {
        expect(new DefaultValueType(new FloatType(), 3.14159265).toString()).toBe("DOUBLE PRECISION DEFAULT 3.14159265");
      });
      it("dates", () => {
        const now = new Date();
        expect(new DefaultValueType(new DateType(), now).toString()).toBe(`TIMESTAMPTZ DEFAULT '${now.toISOString()}'`);
      });
      it("unix epochs", () => {
        const now = new Date();
        expect(new DefaultValueType(new DateType(), now.getTime()).toString()).toBe(`TIMESTAMPTZ DEFAULT ${now.getTime()}`);
      });
      it("current_timestamp", () => {
        expect(new DefaultValueType(new DateType(), 'CURRENT_TIMESTAMP').toString()).toBe(`TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`);
      });
      it("JSON", () => {
        const now = new Date();
        const data = {
          int: 2,
          str: "test with unescaped '",
          nested: {
            date: now,
          },
        };
        const expectedValue = `{"int":2,"str":"test with unescaped ''","nested":{"date":"${now.toISOString()}"}}`;
        expect(new DefaultValueType(new JsonType(), data).toString()).toBe(`JSONB DEFAULT '${expectedValue}'::JSONB`);
      });
      it("empty arrays", () => {
        expect(new DefaultValueType(new ArrayType(new StringType()), []).toString()).toBe(`TEXT[] DEFAULT '{}'::TEXT[]`);
      });
      it("non-empty arrays", () => {
        const value = ["hello", "world"];
        const expected = `TEXT[] DEFAULT '{''hello'',''world''}'::TEXT[]`;
        expect(new DefaultValueType(new ArrayType(new StringType()), value).toString()).toBe(expected);
      });
      it("multi-dimensional arrays", () => {
        const value = [["hello", "world"], ["foo", "bar"]];
        const expected = `TEXT[][] DEFAULT '{{''hello'',''world''},{''foo'',''bar''}}'::TEXT[][]`;
        expect(new DefaultValueType(new ArrayType(new ArrayType(new StringType())), value).toString()).toBe(expected);
      });
    });
  });
});
