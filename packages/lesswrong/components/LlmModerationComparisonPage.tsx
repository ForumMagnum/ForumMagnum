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

Most posts should not be rejected. The bar for rejection is high.

The three most common reasons for rejecting a post are:
* Content that is spam 
* Content that is written by an AI
* Content that is crackpot-ish and claims to solve some big problem without good evidence

Content being informal, low-key, and meandering is not a reason to reject a post. Collections of links or external resources are also fine. Short posts are also fine. Event announcements are also fine.

It is often difficult to detect whether a post was written by an AI. Common tells are: 
* Overuse of headings and subheadings
* Turns of phrases like "delve", "transformative" and other grandiose language

Content by new users is much more likely to be rejected, as they have not established themselves with positive contributions.

`;

// Define a post type to use throughout the component
interface Post {
  _id: string;
  title: string;
  contents: { markdown: string };
  frontpageDate: string | null;
  rejected: boolean;
  user: {
    displayName: string;
    createdAt: string;
    karma: number;
  };
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
    model: "o4-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `
<Author information>
Author name: ${post.user.displayName}
Author karma: ${post.user.karma}
Author created at: ${post.user.createdAt}
</Author information>

<Post>
${post.title}
${post.contents.markdown}
</Post>
` },
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

// Batching helper to process posts in parallel
const BATCH_SIZE = 10;

const processPostsInBatches = async (
  posts: Post[],
  moderationType: "frontpage" | "rejection",
  setPosts: React.Dispatch<React.SetStateAction<PostWithDecision[]>>,
  setProcessedCount: React.Dispatch<React.SetStateAction<number>>, // keeps track of number of finished posts (success or error)
  batchSize: number = BATCH_SIZE,
) => {
  for (let start = 0; start < posts.length; start += batchSize) {
    const batch = posts.slice(start, start + batchSize);

    // Run the whole batch in parallel
    const results = await Promise.allSettled(
      batch.map((post) => processPost(post, moderationType)),
    );

    // Collect successfully processed posts
    const successful: PostWithDecision[] = [];
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        successful.push(result.value);
      } else {
        console.error(
          `Error processing post "${batch[idx].title}" for ${moderationType}:`,
          result.reason,
        );
      }
    });

    // Update post list state with new decisions
    if (successful.length) {
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          const updated = successful.find((u) => u._id === p._id);
          return updated ?? p;
        }),
      );
    }

    // Update processed counter (include successes + failures to indicate progress)
    setProcessedCount((count) => count + batch.length);
  }
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
      posts(input: { terms: { view: "moderationTest", limit: 100, after: "2020-01-01" } }) {
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
          user {
            displayName
            createdAt
            karma
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
      posts(input: { terms: { limit: 100, after: "2020-01-01" } }) {
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
          user {
            displayName
            createdAt
            karma
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

      await processPostsInBatches(
        relevantFrontpagePosts,
        "frontpage",
        setFrontpagePosts,
        setFrontpageProcessedCount,
      );
    };

    void processFrontpagePosts();
  }, [relevantFrontpagePosts]);

  // Process posts for rejection moderation
  useEffect(() => {
    const processRejectionPosts = async () => {
      if (!relevantRejectionPosts.length) return;

      setRejectionProcessedCount(0);
      setRejectionPosts(relevantRejectionPosts);

      await processPostsInBatches(
        relevantRejectionPosts,
        "rejection",
        setRejectionPosts,
        setRejectionProcessedCount,
      );
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
