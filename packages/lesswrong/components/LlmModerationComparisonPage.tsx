import React, { useEffect, useMemo, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { gql, useQuery } from "@apollo/client";
import OpenAI from "openai";

const openRouterKey = ""

const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openRouterKey,
  dangerouslyAllowBrowser: true,
})

const googleAiClient = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: "",
  dangerouslyAllowBrowser: true,
})

const systemPrompt = `You are a helpful assistant that determines whether a post should be on the frontpage of LessWrong. The post will be provided to you in markdown format

You should respond with a JSON object with the following properties:
- shouldBeFrontpage: a boolean value. this should be true if the post should be on the frontpage. The frontpage shows up when you first visit LessWrong, but it is still filtered by people voting on content. About 80% of posts are frontpaged, and 20% sent to personal.
- reason: a string value that provides a short explanation of why the post should or should not be on the frontpage. It should be no more than 100 words.

Whether a post is on the frontpage category has very little to do with whether moderators think it's good.

The criteria are primarily:

Is it timeless? News, organisational announcements and so on are rarely timeless (sometimes timeful things can be talked about in timeless ways, like writing about a theory of how groups work with references to an ongoing election). Coverage of recent AI developments is more like news and isn't timeless.

Is it relevant to LessWrong? The LessWrong topics are basically how to think better, how to make the world better and building models of how parts of the world work. This is last is fairly broad: any deep dive into a field of knowledge or part of the world could potentially be Frontpage. Something that's about someone's family or personal life is unlikely to be Frontpage.

Is it not 'inside baseball'? This is sort of about timelessness and sort of about relevance. This covers organisational announcements, most criticism of specific actors in the space, stuff that's overly focused on rationality or adjacent communities, and so on. For example, a post criticising Elizer or Paul or Sam Altman would not be frontpage.

For example, an analysis of an AI model would not be frontpage. Almost always it should go on Personal (not frontpage) instead. Something that focuses solely on trendlines would be more likely to be frontpage. Even if there are generalisable lessons, unless it's a tutorial explainer, it is unlikely to be frontpage.

Even crackpottery can go on the frontpage if it's about something that's core to LessWrong. The users can vote it down if they don't like it.

If it contains lots of links to reactions and news articles, twitter threads, etc, it is unlikely to be frontpage.

Things that are about the LessWrong website themselves (rather than just the community) are quite likely to be on Frontpage.`

// Define a post type to use throughout the component
interface Post {
  _id: string;
  title: string;
  contents: { markdown: string };
  frontpageDate: string | null;
  [key: string]: any;
}

// Original LLM-based frontpage check
const shouldFrontpage = async (post: Post) => {
  const response = await openRouterClient.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    messages: [{role: "system", content: systemPrompt}, {role: "user", content: `${post.title}\n\n${post.contents.markdown}`}],
    response_format: {type: "json_schema", json_schema: {
      name: "shouldFrontpage",
      schema: {
        type: "object",
        properties: {
          shouldBeFrontpage: {type: "boolean"},
          reason: {type: "string"},
        },
        required: ["shouldBeFrontpage", "reason"],
      },
    }},

  })
  console.log(response)
  const shouldBeFrontpage = JSON.parse(response.choices[0].message.content ?? "{}")
  return {
    ...post,
    ...shouldBeFrontpage,
  }
}

// New similarity-based frontpage check
const shouldFrontpageBySimilarity = async (post: Post) => {
  try {
    // Call our new endpoint to get similar posts and their average frontpageness
    const response = await fetch('/api/getSimilarPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postId: post._id }),
    });

    if (!response.ok) {
      throw new Error(`Error from similar posts endpoint: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Get the recommendation and reason
    const shouldBeFrontpage = {
      shouldBeFrontpage: data.recommendedFrontpage,
      reason: `Based on ${data.similarPosts.length} similar posts, ${Math.round(data.averageFrontpageness * 100)}% are on the frontpage. Similar posts include: ${data.similarPosts.slice(0, 3).map((p: any) => `"${p.title}"`).join(', ')}...`,
    };

    return {
      ...post,
      ...shouldBeFrontpage,
    };
  } catch (error) {
    console.error('Error checking frontpage status by similarity:', error);
    return {
      ...post,
      shouldBeFrontpage: false,
      reason: `Error determining frontpage status: ${error}`,
    };
  }
};

export const LlmModerationComparisonPage = () => {

  const [posts, setPosts] = useState<any[]>([])
  const [processedCount, setProcessedCount] = useState(0)
  const { data, loading } = useQuery(gql`
    query LlmModerationComparisonPage {
      posts(input: {
        terms: {
          limit: 1000,
          after: "2020-01-01",
          before: "2025-01-01"
        }
      }) {
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
        }
      }
    }
  `)
  useEffect(() => {
    if (data) {
      setPosts(data?.posts?.results)
    }
  }, [data])

  const relevantPosts = useMemo(() => 
    data?.posts?.results.filter((d: any) => !d.draft), 
    [data]
  )
  useEffect(() => {
    const fetchPosts = async () => {
      // Reset processed count when starting a new batch
      setProcessedCount(0);
      // Start with the posts we have from the query
      setPosts(relevantPosts || []);
      
      // Define a function to process a single post and update state
      const processPost = async (post: Post) => {
        try {
          // Use similarity-based approach instead of LLM
          const processedPost = await shouldFrontpageBySimilarity(post);
          // Update the posts array by replacing the current post with the processed one
          setPosts(currentPosts => 
            currentPosts.map(p => 
              p._id === post._id ? processedPost : p
            )
          );
          // Increment the processed count
          setProcessedCount(count => count + 1);
          return processedPost;
        } catch (error) {
          console.error(`Error processing post "${post.title}":`, error);
          // Still count failed posts as processed
          setProcessedCount(count => count + 1);
          return post;
        }
      };
      
      // Start processing all posts in parallel
      const processingPromises = (relevantPosts || []).map((post: Post) => processPost(post));
      
      // Wait for all to complete (optional, mainly for logging purposes)
      await Promise.all(processingPromises);
      console.log("All posts processed");
    }
    void fetchPosts();
  }, [relevantPosts]);
  const postsWithDisagreement = useMemo(() => {
    return posts.filter((post) => post.reason && post.shouldBeFrontpage !== (post.frontpageDate !== null))
  }, [posts])
  
  // Calculate the number of processed posts (those that have a reason property)
  const processedPosts = useMemo(() => 
    posts.filter(post => post.reason !== undefined),
    [posts]
  );
  
  return <>
    <h2>Stats</h2>
    <p>Processing status: {processedCount} of {relevantPosts?.length || 0} posts processed</p>
    <table>
      <thead>
        <tr>
          <th>False positive rate</th>
          <th>False negative rate</th>
          <th>Total disagreement rate</th>
          <th>Fraction true frontpage</th>
          <th>Processed</th>
        </tr>
        <tr>
          <td>{processedPosts.length > 0 ? (processedPosts.filter((post) => post.shouldBeFrontpage && !post.frontpageDate).length / processedPosts.length).toFixed(3) : 'N/A'}</td>
          <td>{processedPosts.length > 0 ? (processedPosts.filter((post) => !post.shouldBeFrontpage && post.frontpageDate).length / processedPosts.length).toFixed(3) : 'N/A'}</td>
          <td>{processedPosts.length > 0 ? (postsWithDisagreement.length / processedPosts.length).toFixed(3) : 'N/A'}</td>
          <td>{posts.length > 0 ? (posts.filter((post) => post.frontpageDate).length / posts.length).toFixed(3) : 'N/A'}</td>
          <td>{processedCount} / {relevantPosts?.length || 0}</td>
        </tr>
      </thead>
    </table>
    <pre style={{whiteSpace: "pre-wrap"}}>{JSON.stringify(postsWithDisagreement, null, 2)}</pre>
    <details>
      <summary style={{marginLeft: "3em", fontSize: "5em"}}>All posts</summary>
      <pre style={{whiteSpace: "pre-wrap"}}>{JSON.stringify(posts, null, 2)}</pre>
    </details>
  </>
};

declare global {
  interface ComponentTypes {
    LlmModerationComparisonPage: typeof LlmModerationComparisonPage;
  }
}

registerComponent("LlmModerationComparisonPage", LlmModerationComparisonPage);
