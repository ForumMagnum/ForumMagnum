/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Snippet } from "react-instantsearch-dom";
import { InstantSearch } from "../lib/utils/componentsWithChildren";
import NativeSearchClient from "../lib/search/NativeSearchClient";

it("renders search highlights with the static provider used by the dropdown", () => {
  const client = new NativeSearchClient({emptyStringSearchResults: "empty"});
  jest.spyOn(client, "search").mockResolvedValue({results: []});
  render(<InstantSearch indexName="posts" searchClient={client}>
    <Snippet attribute="body" tagName="mark" hit={{
      objectID: "post1",
      _snippetResult: {body: {value: 'About <ais-highlight-0000000000>alignment</ais-highlight-0000000000> research', matchLevel: "full"}},
    }} />
  </InstantSearch>);
  expect(screen.getByText("alignment").tagName).toBe("MARK");
  expect(screen.getByText("alignment").parentElement?.textContent).toBe("About alignment research");
});
