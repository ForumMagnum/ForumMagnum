import {
  elasticExactAnalyzerFilters,
  elasticNameAnalyzerFilters,
} from "../../server/search/elastic/ElasticExporter";

describe("ElasticExporter analyzers", () => {
  it.each([
    ["exact", elasticExactAnalyzerFilters],
    ["name", elasticNameAnalyzerFilters],
  ])("folds diacritics in the %s analyzer", (_analyzer, filters) => {
    expect(filters).toContain("asciifolding");
  });

  it("folds names before creating n-grams", () => {
    expect(elasticNameAnalyzerFilters.indexOf("asciifolding"))
      .toBeLessThan(elasticNameAnalyzerFilters.indexOf("fm_ngram_filter"));
  });
});
