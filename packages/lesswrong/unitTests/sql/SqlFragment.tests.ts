import SqlFragment from "../../lib/sql/SqlFragment";

describe("SqlFragment", () => {
  it("can parse field entries", () => {
    const getFragment = () => null;
    const fragment = new SqlFragment(`
      fragment TestFragment on TestCollection {
        _id
        a
      }
    `, getFragment);
    const entries = fragment.getParsedEntries();
    expect(entries).toStrictEqual({
      _id: {
        type: "field",
        name: "_id",
        args: [],
      },
      a: {
        type: "field",
        name: "a",
        args: [],
      },
    });
  });
  it("can parse spread entries", () => {
    const getFragment = () => new SqlFragment(`
      fragment SomeOtherFragment on TestCollection {
        _id
        a
      }
    `, () => null);
    const fragment = new SqlFragment(`
      fragment TestFragment on TestCollection {
        ...SomeOtherFragment
      }
    `, getFragment);
    const entries = fragment.getParsedEntries();
    expect(entries).toStrictEqual({
      _id: {
        type: "field",
        name: "_id",
        args: [],
      },
      a: {
        type: "field",
        name: "a",
        args: [],
      },
    });
  });
  it("can parse pick entries without args", () => {
    const getFragment = () => null;
    const fragment = new SqlFragment(`
      fragment TestFragment on TestCollection {
        a {
          _id
        }
      }
    `, getFragment);
    const entries = fragment.getParsedEntries();
    expect(entries).toStrictEqual({
      a: {
        type: "pick",
        name: "a",
        args: [],
        entries: {
          _id: {
            type: "field",
            name: "_id",
            args: [],
          },
        },
      },
    });
  });
  it("can parse pick entries with args", () => {
    const getFragment = () => null;
    const fragment = new SqlFragment(`
      fragment TestFragment on TestCollection {
        a(arg0out: $arg0in, arg1out: $arg1in) {
          _id
        }
      }
    `, getFragment);
    const entries = fragment.getParsedEntries();
    expect(entries).toStrictEqual({
      a: {
        type: "pick",
        name: "a",
        args: [
          {
            inName: "arg0in",
            outName: "arg0out",
          },
          {
            inName: "arg1in",
            outName: "arg1out",
          },
        ],
        entries: {
          _id: {
            type: "field",
            name: "_id",
            args: [],
          },
        },
      },
    });
  });
});
