import { markdownClasses, markdownResponse, renderReactToMarkdown } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { gql } from "@/lib/generated/gql-codegen";

export interface MarkdownCollectionRouteConfig {
  routeTitle: string
  routePath: string
  documentId: string
}

const COLLECTION_QUERY = gql(`
  query MarkdownCollectionByDocumentId($documentId: String!) {
    collection(input: { selector: { documentId: $documentId } }) {
      result {
        _id
        slug
        title
        firstPageLink
        contents {
          agentMarkdown
          plaintextDescription
        }
        books {
          _id
          title
          number
          postIds
          sequenceIds
          sequences {
            _id
            title
          }
        }
      }
    }
  }
`);

interface MarkdownSequence {
  _id: string
  title?: string | null
}

interface MarkdownBook {
  _id: string
  title?: string | null
  number?: number | null
  sequences?: Array<MarkdownSequence | null> | null
}

interface MarkdownCollection {
  _id: string
  title?: string | null
  firstPageLink?: string | null
  contents?: {
    agentMarkdown?: string | null
    plaintextDescription?: string | null
  } | null
  books?: Array<MarkdownBook | null> | null
}

function isMarkdownCollection(value: unknown): value is MarkdownCollection {
  if (!value || typeof value !== "object") return false;
  const maybeCollection = value as { _id?: unknown };
  return typeof maybeCollection._id === "string";
}

export async function renderCollectionMarkdown(req: NextRequest, config: MarkdownCollectionRouteConfig): Promise<Response> {
  const resolverContext = await getContextFromReqAndRes({ req });
  const { data } = await runQuery(COLLECTION_QUERY, {
    documentId: config.documentId,
  }, resolverContext);
  const maybeCollection = data?.collection?.result;

  if (!isMarkdownCollection(maybeCollection)) {
    const markdown = await renderReactToMarkdown(
      <div>
        <div className={markdownClasses.title}>Collection Not Found</div>
        <div>No collection found for route: {config.routePath}</div>
      </div>
    );
    return new Response(markdown, {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  const collection = maybeCollection;

  const descriptionMarkdown = collection.contents?.agentMarkdown || collection.contents?.plaintextDescription || "";

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>{config.routeTitle}</div>
      <div>
        Collection URL (HTML): <a href={config.routePath}>{config.routePath}</a>
      </div>
      <div>
        Collection URL (Markdown): <a href={`/api${config.routePath}`}>{`/api${config.routePath}`}</a>
      </div>
      {collection.firstPageLink ? (
        <div>
          Start reading: <a href={collection.firstPageLink}>{collection.firstPageLink}</a>
        </div>
      ) : null}

      <h2>Description</h2>
      {descriptionMarkdown ? (
        <MarkdownNode markdown={descriptionMarkdown} />
      ) : (
        <div><em>No collection description available.</em></div>
      )}

      <h2>Books and Sequences</h2>
      {(collection.books?.length ?? 0) > 0 ? (
        <div>
          {collection.books?.map((book: MarkdownBook) => {
            if (!book) return null;
            return (
              <div key={book._id}>
                <h3>
                  {book.number !== undefined && book.number !== null ? `Book ${book.number}` : "Book"}
                  {book.title ? `: ${book.title}` : ""}
                </h3>
                {(book.sequences?.length ?? 0) > 0 ? (
                  <ul>
                    {book.sequences?.map((sequence: MarkdownSequence) => {
                      if (!sequence) return null;
                      return (
                        <li key={sequence._id}>
                          <a href={`/api/sequence/${sequence._id}`}>{sequence.title || sequence._id}</a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div><em>No sequences listed for this book.</em></div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div><em>No books found in this collection.</em></div>
      )}
    </div>
  );
}
