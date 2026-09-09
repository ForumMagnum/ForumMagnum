import { Client } from "@elastic/elasticsearch";
import type { BulkHelper, BulkHelperOptions } from "@elastic/elasticsearch/lib/helpers";
import ElasticClient from "../../server/search/elastic/ElasticClient";
import ElasticExporter from "../../server/search/elastic/ElasticExporter";
import TagsRepo from "../../server/repos/TagsRepo";

jest.mock("../../server/search/elastic/ElasticClient");
jest.mock("../../server/collections/allCollections", () => ({
  getCollection: (collectionName: string) => ({collectionName}),
}));
jest.mock("../../server/repos/PostsRepo", () => ({__esModule: true, default: jest.fn()}));
jest.mock("../../server/repos/CommentsRepo", () => ({__esModule: true, default: jest.fn()}));
jest.mock("../../server/repos/SequencesRepo", () => ({__esModule: true, default: jest.fn()}));
jest.mock("../../server/repos/UsersRepo", () => ({__esModule: true, default: jest.fn()}));
jest.mock("../../server/repos/TagsRepo", () => {
  const countSearchDocuments = jest.fn();
  const getSearchDocuments = jest.fn();
  return {__esModule: true, default: jest.fn(() => ({countSearchDocuments, getSearchDocuments}))};
});

const client = new Client({node: "http://localhost:9200"});
const repo = new TagsRepo();
const shards = {total: 1, successful: 1, failed: 0};

function dropBulkDocument<TDocument>(options: BulkHelperOptions<TDocument>): BulkHelper<TDocument> {
  if (!Array.isArray(options.datasource)) throw new Error("Expected document array");
  options.onDrop?.({
    document: options.datasource[0], status: 400, operation: {index: {}},
    error: {type: "mapper_parsing_exception", reason: "invalid document"}, retried: false,
  });
  const stats = {total: 1, failed: 1, retry: 0, successful: 0, noop: 0, time: 0, bytes: 0, aborted: false};
  return Object.assign(Promise.resolve(stats), {abort: jest.fn(), stats});
}

beforeEach(() => {
  jest.spyOn(ElasticClient.prototype, "getClient").mockReturnValue(client);
  jest.spyOn(repo, "countSearchDocuments").mockResolvedValue(1);
  jest.spyOn(repo, "getSearchDocuments").mockResolvedValue([]).mockResolvedValueOnce([{
    _id: "current-tag", objectID: "current-tag", _index: "tags", publicDateMs: 0,
    name: "Decision theory", slug: "decision-theory", core: false, defaultOrder: 0,
    suggestedAsFilter: false, postCount: 461, baseScore: 12, wikiOnly: false,
    isSubforum: false, description: "",
  }]);
  jest.spyOn(Date, "now").mockReturnValue(123);
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(client.indices, "getAlias").mockResolvedValue({tags_old: {aliases: {tags: {}}}});
  jest.spyOn(client.indices, "getSettings").mockResolvedValue({tags_old: {settings: {index: {analysis: {
    filter: {fm_synonym_filter: {type: "synonym", synonyms: ["dt, decision theory"]}},
  }}}}});
  jest.spyOn(client.indices, "create").mockResolvedValue({acknowledged: true, shards_acknowledged: true, index: "tags_123"});
  jest.spyOn(client.indices, "close").mockResolvedValue({acknowledged: true, shards_acknowledged: true, indices: {}});
  jest.spyOn(client.indices, "putSettings").mockResolvedValue({acknowledged: true});
  jest.spyOn(client.indices, "open").mockResolvedValue({acknowledged: true, shards_acknowledged: true});
  jest.spyOn(client.indices, "refresh").mockResolvedValue({_shards: shards});
  jest.spyOn(client, "count").mockResolvedValue({count: 1, _shards: shards});
  jest.spyOn(client.indices, "updateAliases").mockResolvedValue({acknowledged: true});
  jest.spyOn(client.indices, "delete");
  jest.spyOn(client.helpers, "bulk").mockResolvedValue({
    total: 1, failed: 0, retry: 0, successful: 1, noop: 0, time: 0, bytes: 0, aborted: false,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

it("exports current database records and checks the refreshed count before switching, preserving synonyms and the old index", async () => {
  await new ElasticExporter().recreateIndex("Tags");
  expect(client.helpers.bulk).toHaveBeenCalledWith(expect.objectContaining({
    datasource: [expect.objectContaining({objectID: "current-tag"})],
  }));
  expect(client.indices.getSettings).toHaveBeenCalledWith({index: "tags_old"});
  expect(client.indices.putSettings).toHaveBeenCalledWith(expect.objectContaining({
    index: "tags_123", body: {settings: {index: {analysis: {
      filter: {fm_synonym_filter: {type: "synonym", synonyms: ["dt, decision theory"]}},
    }}}},
  }));
  expect(client.indices.refresh).toHaveBeenCalledWith({index: "tags_123"});
  expect(client.count).toHaveBeenCalledWith({index: "tags_123"});
  expect(jest.spyOn(client.indices, "refresh").mock.invocationCallOrder[0]).toBeLessThan(jest.spyOn(client, "count").mock.invocationCallOrder[0]);
  expect(jest.spyOn(client, "count").mock.invocationCallOrder[0]).toBeLessThan(jest.spyOn(client.indices, "updateAliases").mock.invocationCallOrder[0]);
  expect(client.indices.updateAliases).toHaveBeenCalledWith({actions: [
    {remove: {index: "tags_old", alias: "tags"}},
    {add: {index: "tags_123", alias: "tags"}},
  ]});
  expect(client.indices.delete).not.toHaveBeenCalled();
});

it("leaves the alias unchanged if a bulk request fails", async () => {
  jest.spyOn(client.helpers, "bulk").mockRejectedValueOnce(new Error("bulk failed"));
  await expect(new ElasticExporter().recreateIndex("Tags")).rejects.toThrow("bulk failed");
  expect(client.indices.updateAliases).not.toHaveBeenCalled();
  expect(client.indices.delete).not.toHaveBeenCalled();
});

it("leaves the alias unchanged when bulk succeeds but drops a rejected document", async () => {
  jest.spyOn(client.helpers, "bulk").mockImplementationOnce(dropBulkDocument);
  await expect(new ElasticExporter().recreateIndex("Tags")).rejects.toThrow("Failed to index 1 Tags documents");
  expect(client.indices.updateAliases).not.toHaveBeenCalled();
  expect(client.indices.delete).not.toHaveBeenCalled();
});

it("leaves the alias unchanged when exported documents do not match the current database count", async () => {
  jest.spyOn(client, "count").mockResolvedValueOnce({count: 0, _shards: shards});
  await expect(new ElasticExporter().recreateIndex("Tags")).rejects.toThrow("indexed 0 of 1 database documents");
  expect(client.indices.updateAliases).not.toHaveBeenCalled();
  expect(client.indices.delete).not.toHaveBeenCalled();
});

it("leaves the alias unchanged if refresh reports a shard failure", async () => {
  jest.spyOn(client.indices, "refresh").mockResolvedValueOnce({_shards: {...shards, failed: 1}});
  await expect(new ElasticExporter().recreateIndex("Tags")).rejects.toThrow("Failed to refresh");
  expect(client.indices.updateAliases).not.toHaveBeenCalled();
});
