import React from "react";
import { Highlight } from "react-instantsearch-dom";

interface SearchHighlightProps {
  hit: {
    objectID: string;
    _highlightResult?: Record<string, {value?: string}>;
  };
  attribute: string;
  children: React.ReactNode;
}

export default function SearchHighlight({hit, attribute, children}: SearchHighlightProps) {
  if (!hit._highlightResult?.[attribute]?.value) return <>{children}</>;
  return <Highlight attribute={attribute} hit={hit} tagName="mark" />;
}
