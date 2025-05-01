import React, { useEffect, useMemo, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { gql, useQuery } from "@apollo/client";
import OpenAI from "openai";
import { openAIApiKey } from "@/lib/instanceSettings";
import { Components } from "@/lib/vulcan-lib/components";

const openAIClient = new OpenAI({
  apiKey: openAIApiKey.get() ?? undefined,
  dangerouslyAllowBrowser: true,
});

// Placeholder for frontpage moderation system prompt
const frontpageSystemPrompt = `You are a helpful assistant that makes automated moderation decisions for LessWrong posts. The post will be provided to you in Markdown format.

You should respond with a JSON object with the following properties: 
- decision: a string value
  - This should be "frontpage" if the post should be on the frontpage
  - This should be "personal" if the post should be left on someone's "personal LW blog"
- reason: A string value that provides a short explanation of why the post was assigned this decision. It should be no more than 100 words. 

First, determine whether a post should be rejected for not meeting LessWrong's content standard. 

The most common reasons for completely rejecting a post is unclear exposition, crackpot-ish ideas, or spam. Content about Artificial Intelligence is generally held to a higher standard, especially from new users.

Then, if the post is not to be rejected on content standard grounds, you should determine whether the post is timeless and of general interest to LessWrong readers, or is about local LW community drama. If it is, the post should be classified as "frontpage", if not, it should be classified as "personal". 

Most content that is not rejected is considered frontpage, so the question is whether there is a strong case that a post is either not timeless, is of very niche interest, or is centrally about community drama. It is OK for a post to contain non-timeless sections, to have some sections only of interest to a niche audience, or to have some sections with community drama, as long as most of the post does not fall into either of these three categories.
`;

// Placeholder for rejection moderation system prompt
const rejectionSystemPrompt = `You are a helpful assistant that makes automated moderation decisions for LessWrong posts. Your task is to determine if posts should be rejected for not meeting content standards. The post will be provided to you in Markdown format.

You should respond with a JSON object with the following properties: 
- decision: a string value
  - This should be "rejected" if the post violates LW content standards
  - This should be "accepted" if the post meets the minimum content standards
- reason: A string value that provides a short explanation of why the post was assigned this decision. It should be no more than 100 words.

The most common reasons for completely rejecting a post is unclear exposition, crackpot-ish ideas, spam, or content that is hostile or inflammatory. Content about Artificial Intelligence is generally held to a higher standard, especially from new users.
`;

// Define a post type to use throughout the component
interface Post {
  _id: string;
  title: string;
  contents: { markdown: string };
  frontpageDate: string | null;
  rejected: boolean;
}

interface PostWithDecision extends Post {
  decision: "frontpage" | "personal" | "rejected" | "accepted";
  reason: string;
}

// Process post based on moderation type
const processPost = async (post: Post, moderationType: "frontpage" | "rejection"): Promise<PostWithDecision> => {
  const prompt = moderationType === "frontpage" ? frontpageSystemPrompt : rejectionSystemPrompt;
  const schema = {
    name: "ModerationSchema",
    schema: {
      type: "object",
      properties: {
        decision: {
          type: "string",
          enum: moderationType === "frontpage" ? ["frontpage", "personal"] : ["rejected", "accepted"],
        },
        reason: { type: "string" },
      },
      required: ["decision", "reason"],
    },
  };

  const response = await openAIClient.chat.completions.create({
    model: "gpt-4.1-nano-2025-04-14",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `${post.title}\n\n${post.contents.markdown}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: schema,
    },
  });

  const result = JSON.parse(response.choices[0].message.content ?? "{}");
  return {
    ...post,
    ...result,
  };
};

export const LlmModerationComparisonPage = () => {
  const { ModerationResults } = Components;
  const [frontpagePosts, setFrontpagePosts] = useState<PostWithDecision[]>([]);
  const [rejectionPosts, setRejectionPosts] = useState<PostWithDecision[]>([]);
  const [frontpageProcessedCount, setFrontpageProcessedCount] = useState(0);
  const [rejectionProcessedCount, setRejectionProcessedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"frontpage" | "rejection">("frontpage");

  // Query for rejection moderation (with moderationTest view)
  const { data: rejectionData, loading: rejectionLoading } = useQuery(gql`
    query LlmRejectionModerationPage {
      posts(input: { terms: { view: "moderationTest", limit: 100, after: "2020-01-01", before: "2025-01-01" } }) {
        results {
          _id
          title
          frontpageDate
          createdAt
          baseScore
          commentCount
          contents {
            markdown
          }
          draft
          rejected
        }
      }
    }
  `);

  // Query for frontpage moderation (without moderationTest view)
  const { data: frontpageData, loading: frontpageLoading } = useQuery(gql`
    query LlmFrontpageModerationPage {
      posts(input: { terms: { limit: 100, after: "2020-01-01", before: "2025-01-01" } }) {
        results {
          _id
          title
          frontpageDate
          createdAt
          baseScore
          commentCount
          contents {
            markdown
          }
          draft
          rejected
        }
      }
    }
  `);

  const relevantRejectionPosts = useMemo(
    () => rejectionData?.posts?.results.filter((d: any) => !d.draft) || [], 
    [rejectionData]
  );

  const relevantFrontpagePosts = useMemo(
    () => frontpageData?.posts?.results.filter((d: any) => !d.draft) || [], 
    [frontpageData]
  );

  // Process posts for frontpage moderation
  useEffect(() => {
    const processFrontpagePosts = async () => {
      if (!relevantFrontpagePosts.length) return;

      setFrontpageProcessedCount(0);
      setFrontpagePosts(relevantFrontpagePosts);

      for (const post of relevantFrontpagePosts) {
        try {
          const processedPost = await processPost(post, "frontpage");
          setFrontpagePosts((currentPosts) => currentPosts.map((p) => (p._id === post._id ? processedPost : p)));
          setFrontpageProcessedCount((count) => count + 1);
        } catch (error) {
          console.error(`Error processing post "${post.title}" for frontpage:`, error);
          setFrontpageProcessedCount((count) => count + 1);
        }
      }
    };

    void processFrontpagePosts();
  }, [relevantFrontpagePosts]);

  // Process posts for rejection moderation
  useEffect(() => {
    const processRejectionPosts = async () => {
      if (!relevantRejectionPosts.length) return;

      setRejectionProcessedCount(0);
      setRejectionPosts(relevantRejectionPosts);

      for (const post of relevantRejectionPosts) {
        try {
          const processedPost = await processPost(post, "rejection");
          setRejectionPosts((currentPosts) => currentPosts.map((p) => (p._id === post._id ? processedPost : p)));
          setRejectionProcessedCount((count) => count + 1);
        } catch (error) {
          console.error(`Error processing post "${post.title}" for rejection:`, error);
          setRejectionProcessedCount((count) => count + 1);
        }
      }
    };

    void processRejectionPosts();
  }, [relevantRejectionPosts]);

  return (
    <div className="llm-moderation-comparison">
      <h1>LLM Moderation Comparison</h1>

      <div className="moderation-tabs">
        <button className={activeTab === "frontpage" ? "active" : ""} onClick={() => setActiveTab("frontpage")}>
          Frontpage Moderation
        </button>
        <button className={activeTab === "rejection" ? "active" : ""} onClick={() => setActiveTab("rejection")}>
          Rejection Moderation
        </button>
      </div>

      {activeTab === "frontpage" ? (
        <ModerationResults
          moderationType="frontpage"
          posts={frontpagePosts as Post[]}
          processedCount={frontpageProcessedCount}
          relevantPostsCount={relevantFrontpagePosts.length}
        />
      ) : (
        <ModerationResults
          moderationType="rejection"
          posts={rejectionPosts as Post[]}
          processedCount={rejectionProcessedCount}
          relevantPostsCount={relevantRejectionPosts.length}
        />
      )}

      <details>
        <summary style={{ marginLeft: "3em", fontSize: "2em" }}>All posts</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(activeTab === "frontpage" ? frontpagePosts : rejectionPosts, null, 2)}
        </pre>
      </details>
    </div>
  );
};

declare global {
  interface ComponentTypes {
    LlmModerationComparisonPage: typeof LlmModerationComparisonPage;
  }
}

registerComponent("LlmModerationComparisonPage", LlmModerationComparisonPage);
