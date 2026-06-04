const DOCUMENT_NAME_PREFIXES: ReadonlyArray<{ prefix: string; collectionName: string }> = [
  { prefix: 'post-', collectionName: 'Posts' },
  { prefix: 'research-doc-', collectionName: 'ResearchDocuments' },
];

export interface ParsedDocument {
  collectionName: string;
  documentId: string;
}

export function parseDocumentName(documentName: string): ParsedDocument {
  for (const { prefix, collectionName } of DOCUMENT_NAME_PREFIXES) {
    if (documentName.startsWith(prefix)) {
      return { collectionName, documentId: documentName.slice(prefix.length) };
    }
  }
  throw new Error(`Unrecognized document name prefix: ${documentName}`);
}

export function documentNamePrefixForCollection(collectionName: string): string {
  for (const { prefix, collectionName: name } of DOCUMENT_NAME_PREFIXES) {
    if (name === collectionName) {
      return prefix;
    }
  }
  throw new Error(`Unknown collection: ${collectionName}`);
}
