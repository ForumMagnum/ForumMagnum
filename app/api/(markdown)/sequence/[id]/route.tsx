import { gql } from "@/lib/generated/gql-codegen";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { markdownClasses, markdownResponse, renderReactToMarkdown } from "@/server/markdownApi/markdownResponse";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { MarkdownDate } from "@/server/markdownComponents/MarkdownDate";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { MarkdownPostsList } from "@/server/markdownComponents/MarkdownPostsList";
import { MarkdownUserLink } from "@/server/markdownComponents/MarkdownUserLink";

const DEFAULT_CHAPTER_LIMIT = 200;
const MAX_CHAPTER_LIMIT = 500;

const parseLimit = (value: string | null): number => {
  if (!value) return DEFAULT_CHAPTER_LIMIT;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_CHAPTER_LIMIT;
  return Math.min(parsed, MAX_CHAPTER_LIMIT);
};

const SEQUENCE_QUERY = gql(`
  query MarkdownSequenceById($id: String!, $chapterLimit: Int) {
    sequence(selector: { _id: $id }) {
      result {
        _id
        title
        createdAt
        postsCount
        user {
          slug
          displayName
        }
        contents {
          agentMarkdown
          plaintextDescription
        }
      }
    }
    chapters(selector: { SequenceChapters: { sequenceId: $id } }, limit: $chapterLimit) {
      results {
        _id
        title
        number
        posts {
          ...MarkdownPostsList
        }
      }
    }
  }
`);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return new Response("No sequence id provided", { status: 400 });
  }

  const resolverContext = await getContextFromReqAndRes({ req });
  const chapterLimit = parseLimit(req.nextUrl.searchParams.get("limit"));
  let data;
  try {
    const queryResult = await runQuery(SEQUENCE_QUERY, {
      id,
      chapterLimit,
    }, resolverContext);
    data = queryResult.data;
  } catch {
    const markdown = await renderReactToMarkdown(
      <div>
        <div className={markdownClasses.title}>Sequence Not Found</div>
        <div>No sequence found with id: {id}</div>
      </div>
    );
    return new Response(markdown, {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const sequence = data?.sequence?.result;
  const chapters = data?.chapters?.results ?? [];

  if (!sequence) {
    const markdown = await renderReactToMarkdown(
      <div>
        <div className={markdownClasses.title}>Sequence Not Found</div>
        <div>No sequence found with id: {id}</div>
      </div>
    );
    return new Response(markdown, {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>Sequence: {sequence.title}</div>
      <div>
        Sequence URL (HTML): <a href={`/s/${sequence._id}`}>{`/s/${sequence._id}`}</a>
      </div>
      <div>
        Sequence URL (Markdown): <a href={`/api/sequence/${sequence._id}`}>{`/api/sequence/${sequence._id}`}</a>
      </div>
      <ul>
        {sequence.user ? <li>Author: <MarkdownUserLink user={sequence.user} /></li> : null}
        {sequence.createdAt ? <li>Created: <MarkdownDate date={sequence.createdAt} /></li> : null}
        {sequence.postsCount !== undefined && sequence.postsCount !== null ? <li>Posts: {sequence.postsCount}</li> : null}
      </ul>

      <h2>Description</h2>
      {sequence.contents?.agentMarkdown ? (
        <MarkdownNode markdown={sequence.contents.agentMarkdown} />
      ) : sequence.contents?.plaintextDescription ? (
        <div>{sequence.contents.plaintextDescription}</div>
      ) : (
        <div><em>No description available.</em></div>
      )}

      <h2>Chapters</h2>
      {chapters.length === 0 ? (
        <div><em>No chapters found.</em></div>
      ) : (
        <div>
          {chapters.map((chapter) => (
            <div key={chapter._id}>
              <h3>
                {chapter.number !== undefined && chapter.number !== null ? `Chapter ${chapter.number}` : "Chapter"}
                {chapter.title ? `: ${chapter.title}` : ""}
              </h3>
              <MarkdownPostsList posts={chapter.posts ?? []} includeExcerpt={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
