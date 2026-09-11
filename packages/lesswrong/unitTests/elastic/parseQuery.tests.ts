import { parseQuery } from "../../server/search/elastic/parseQuery";

describe("elastic - parseQuery", () => {
  it("can parse simple queries", () => {
    const result = parseQuery("a test query");
    expect(result).toStrictEqual({
      tokens: [
        {type: "should", "token": "a"},
        {type: "should", "token": "test"},
        {type: "should", "token": "query"},
      ],
      isAdvanced: false,
    });
  });
  it("can parse queries with 'not' tokens", () => {
    const result = parseQuery("a test -query");
    expect(result).toStrictEqual({
      tokens: [
        {type: "should", "token": "a"},
        {type: "should", "token": "test"},
        {type: "not", "token": "query"},
      ],
      isAdvanced: true,
    });
  });
  it("can parse queries with double-quoted 'required' tokens", () => {
    const result = parseQuery("a test \"query\"");
    expect(result).toStrictEqual({
      tokens: [
        {type: "should", "token": "a"},
        {type: "should", "token": "test"},
        {type: "must", "token": "query"},
      ],
      isAdvanced: true,
    });
  });
  it("can parse queries with single-quoted 'required' tokens", () => {
    const result = parseQuery("a test 'query'");
    expect(result).toStrictEqual({
      tokens: [
        {type: "should", "token": "a"},
        {type: "should", "token": "test"},
        {type: "must", "token": "query"},
      ],
      isAdvanced: true,
    });
  });
  it("can parse queries with mixed advanced tokens", () => {
    const result = parseQuery("-a \"test\" 'query'");
    expect(result).toStrictEqual({
      tokens: [
        {type: "not", "token": "a"},
        {type: "must", "token": "test"},
        {type: "must", "token": "query"},
      ],
      isAdvanced: true,
    });
  });
  it("keeps non-ASCII letters and splits Unicode dashes", () => {
    expect(parseQuery("日本語 ショーペンハウアー")).toStrictEqual({
      tokens: [
        {type: "should", "token": "日本語"},
        {type: "should", "token": "ショーペンハウアー"},
      ],
      isAdvanced: false,
    });
    expect(parseQuery("Navier–Stokes")).toStrictEqual({
      tokens: [{type: "should", "token": "Navier Stokes"}],
      isAdvanced: false,
    });
    expect(parseQuery("“behave responsibly”")).toStrictEqual({
      tokens: [{type: "must", "token": "behave responsibly"}],
      isAdvanced: true,
    });
  });
});
