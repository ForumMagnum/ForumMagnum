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
    const entries = fragment.parseEntries();
    expect(entries).toStrictEqual({
      _id: {
        type: "field",
        name: "_id",
      },
      a: {
        type: "field",
        name: "a",
      },
    });
  });
  it("can parse spread entries", () => {
    const getFragment = () => null;
    const fragment = new SqlFragment(`
      fragment TestFragment on TestCollection {
        ...SomeOtherFragment
      }
    `, getFragment);
    const entries = fragment.parseEntries();
    expect(entries).toStrictEqual({
      SomeOtherFragment: {
        type: "spread",
        fragmentName: "SomeOtherFragment",
      },
    });
  });
  it("can parse pick entries", () => {
    const getFragment = () => null;
    const fragment = new SqlFragment(`
      fragment TestFragment on TestCollection {
        a {
          _id
        }
      }
    `, getFragment);
    const entries = fragment.parseEntries();
    expect(entries).toStrictEqual({
      a: {
        type: "pick",
        name: "a",
        entries: {
          _id: {
            type: "field",
            name: "_id",
          },
        },
      },
    });
  });
});
