import { gql } from "@/lib/generated/gql-codegen";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { markdownClasses, markdownResponse, renderReactToMarkdown } from "@/server/markdownApi/markdownResponse";
import { MarkdownPostsList } from "@/server/markdownComponents/MarkdownPostsList";
import { runQuery } from "@/server/vulcan-lib/query";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { NextRequest } from "next/server";
import { getPostsListLimit } from "../../postsListUtils";

const TAG_QUERY = gql(`
  query MarkdownTagBySlug($slug: String!) {
    tags(selector: { tagBySlug: { slug: $slug } }, limit: 1) {
      results {
        _id
        name
        slug
        subtitle
        wikiOnly
        parentTag {
          _id
          name
          slug
        }
        subTags {
          _id
          name
          slug
        }
        description {
          _id
          agentMarkdown
        }
      }
    }
  }
`);

const TAG_POSTS_QUERY = gql(`
  query MarkdownTagPosts($tagId: String!, $limit: Int) {
    posts(selector: { tagRelevance: { tagId: $tagId } }, limit: $limit) {
      results {
        ...MarkdownPostsList
      }
    }
  }
`);

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolverContext = await getContextFromReqAndRes({ req });
  const { data } = await runQuery(TAG_QUERY, { slug }, resolverContext);
  const tag = data?.tags?.results?.[0];

  if (!tag) {
    const markdown = await renderReactToMarkdown(
      <div>
        <div className={markdownClasses.title}>Tag Not Found</div>
        <div>No tag found with slug: {slug}</div>
      </div>
    );
    return new Response(markdown, {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const limit = Math.min(getPostsListLimit(req), 12);
  const { data: postData } = await runQuery(TAG_POSTS_QUERY, { tagId: tag._id, limit }, resolverContext);
  const taggedPosts = postData?.posts?.results ?? [];

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>Tag: {tag.name}</div>
      <div>
        Canonical page: <a href={`/w/${tag.slug}`}>{`/w/${tag.slug}`}</a>
      </div>
      <div>
        Discussion page: <a href={`/w/${tag.slug}/discussion`}>{`/w/${tag.slug}/discussion`}</a>
      </div>
      {tag.subtitle ? <div>{tag.subtitle}</div> : null}
      {tag.parentTag ? (
        <div>
          Parent tag: <a href={`/api/tag/${tag.parentTag.slug}`}>{tag.parentTag.name}</a>
        </div>
      ) : null}
      {tag.subTags.length > 0 ? (
        <div>
          Subtags:{" "}
          {tag.subTags.map((subTag, index) => (
            <span key={subTag._id}>
              <a href={`/api/tag/${subTag.slug}`}>{subTag.name}</a>
              {index < tag.subTags.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      ) : null}
      <h2>Wiki Content</h2>
      {tag.description?.agentMarkdown ? (
        <MarkdownNode markdown={tag.description.agentMarkdown} />
      ) : (
        <div><em>This tag has no wiki content yet.</em></div>
      )}
      {!tag.wikiOnly ? (
        <>
          <h2>Posts Tagged {tag.name}</h2>
          <MarkdownPostsList posts={taggedPosts} includeExcerpt={false} />
        </>
      ) : null}
    </div>
  );
}
