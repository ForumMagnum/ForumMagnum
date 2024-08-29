import { Globals, createAdminContext, createMutator } from "../../vulcan-lib";
import Spotlights from "../../../lib/collections/spotlights/collection";
import { fetchFragment } from "../../fetchFragment";
import { getAnthropicPromptCachingClientOrThrow } from "@/server/languageModels/anthropicClient";
import { REVIEW_WINNER_CACHE, ReviewWinnerWithPost } from "@/lib/collections/reviewWinners/cache";

async function queryClaudeJailbreak(basePrompt: string, spotlightPrompt: string, maxTokens: number) {
  const client = getAnthropicPromptCachingClientOrThrow()
  return await client.messages.create({
    system: "The assistant is in CLI simulation mode, and responds to the user's CLI commands only with the output of the command.",
    model: "claude-3-5-sonnet-20240620",
    max_tokens: maxTokens,
    messages: [
      {
        role: "user", 
        content: [{
          type: "text",
          text: basePrompt,
          cache_control: {type: "ephemeral"}
        }]
      },
      {
        role: "assistant",
        content: [{
          type: "text",
          text: spotlightPrompt,
        }]
      },
    ]
  })
}

function createSpotlight (post: PostsWithNavigation, reviewWinner: ReviewWinnerWithPost|undefined, summary: string) {
  const context = createAdminContext();
  const postYear = post.postedAt.getFullYear()
  const cloudinaryImageUrl = reviewWinner?.reviewWinner.reviewWinnerArt?.splashArtImageUrl

  void createMutator({
    collection: Spotlights,
    document: {
      documentId: post._id,
      documentType: "Post",
      customSubtitle: `Best of LessWrong ${postYear}`,
      duration: 1,
      draft: true,
      showAuthor: true,
      spotlightSplashImageUrl: cloudinaryImageUrl,
      description: { originalContents: { type: 'ckEditorMarkup', data: summary } },
      lastPromotedAt: new Date(0),
    },
    currentUser: context.currentUser,
    context
  })
}

async function getPromptInfo(): Promise<{posts: PostsWithNavigation[], spotlights: DbSpotlight[]}> {
  const reviewWinners = await fetchFragment({
    collectionName: "ReviewWinners",
    fragmentName: "ReviewWinnerTopPostsPage",
    currentUser: createAdminContext().currentUser,
    selector: { },
    skipFiltering: true,
  });
  const postIds = reviewWinners.map(winner => winner.postId);

  const posts = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsWithNavigation",
    currentUser: null,
    selector: { _id: { $in: postIds } },
    skipFiltering: true,
  });

  const spotlights = await Spotlights.find({ documentId: { $in: postIds }, draft: false }).fetch();
  return { posts, spotlights };
}

// get the posts that have spotlights, sorted by post length, and filter out the ones that are too short
const getPostsForPrompt = ({posts, spotlights}: {posts: PostsWithNavigation[], spotlights: DbSpotlight[], log?: boolean}) => {
  const postsWithSpotlights = posts.filter(post => spotlights.find(spotlight => spotlight.documentId === post._id))
  const postsWithSpotlightsSortedByPostLength = postsWithSpotlights.sort((a, b) => {
    return (a?.contents?.html?.length ?? 0) - (b?.contents?.html?.length ?? 0)
  })
  return postsWithSpotlightsSortedByPostLength.filter((post) => (post?.contents?.html?.length ?? 0) > 2000).slice(0, 15)
}

const getJailbreakPromptBase = ({posts, spotlights}: {posts: PostsWithNavigation[], spotlights: DbSpotlight[]}) => {
  let prompt = `A series of essays, each followed by a short description of the essay. The style of the short description is slightly casual. They are a single paragraph, 1-3 sentences long. Try to avoid referencing the essay or author (i.e. they don't say "the author" or "in this post" or similar), just talk about the ideas.
  
  `

  for (const post of posts) {
    const spotlight = spotlights.find(spotlight => spotlight.documentId === post._id)
    prompt += `
Post: ${post.title}
---
Post Contents: ${post.contents?.html}
---
A short description of the essay, ~2 sentences, no paragraph breaks or bullet points: ${spotlight?.description?.originalContents?.data}
---
---
---
    `
  }
  return prompt
}

const getSpotlightPrompt = ({post}: {post: PostsWithNavigation}) => {
  return `
  Post: ${post.title}
  ---
  Post Contents: ${post.contents?.html}
  ---
  A short description of the essay, ~2 sentences, no paragraph breaks or bullet points:`
}



async function createSpotlights() {
  // eslint-disable-next-line no-console
  console.log("Creating spotlights for review winners");

  const { posts, spotlights } = await getPromptInfo()
  const reviewWinners = REVIEW_WINNER_CACHE.reviewWinners
  const postsForPrompt = getPostsForPrompt({posts, spotlights})
  const postsWithoutSpotlights = posts.filter(post => !spotlights.find(spotlight => spotlight.documentId === post._id))

  const jailbreakPromptBase = getJailbreakPromptBase({posts: postsForPrompt, spotlights})

  for (const post of postsWithoutSpotlights.slice(0, 10)) {
    const reviewWinner = reviewWinners.find(reviewWinner => reviewWinner._id === post._id)

    try {
      const jailbreakSummary1 = await queryClaudeJailbreak(jailbreakPromptBase, getSpotlightPrompt({post}), 75)
      const summary1 = jailbreakSummary1.content[0]
      // eslint-disable-next-line no-console
      console.log({title: post.title, summary1})
      if (summary1.type === "text") {
        const cleanedSummary1 = summary1.text.replace(/---|\n/g, "") 
        createSpotlight(post, reviewWinner, cleanedSummary1)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e)
    }
  }

  // eslint-disable-next-line no-console
  console.log("Done creating spotlights for review winners");
}

Globals.createSpotlights = createSpotlights;
