import { Globals, createAdminContext, createMutator } from "../../vulcan-lib";
import Spotlights from "../../../lib/collections/spotlights/collection";
import { fetchFragment } from "../../fetchFragment";
import { getAnthropicPromptCachingClientOrThrow } from "@/server/languageModels/anthropicClient";
import { REVIEW_WINNER_CACHE, ReviewWinnerWithPost } from "@/lib/collections/reviewWinners/cache";

async function queryClaudeJailbreak(basePrompt: string, spotlightPrompt: string) {
  const client = getAnthropicPromptCachingClientOrThrow()
  return await client.messages.create({
    system: "The assistant is in CLI simulation mode, and responds to the user's CLI commands only with the output of the command.",
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 75,
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
  void createMutator({
    collection: Spotlights,
    document: {
      documentId: post._id,
      documentType: "Post",
      customSubtitle: `Best of LessWrong ${postYear}`,
      duration: 1,
      draft: true,
      showAuthor: true,
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
  // Assume these functions exist to fetch data from the database
  const posts = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsWithNavigation",
    currentUser: null,
    selector: { _id: { $in: postIds } },
    skipFiltering: true,
  });
  console.log("posts", posts[0])

  const spotlights = await Spotlights.find({ documentId: { $in: postIds }, draft: false }).fetch();
  return { posts, spotlights };
}

// get the posts that have spotlights, sorted by post length, and filter out the ones that are too short
const getPostsForPrompt = ({posts, spotlights, log=false}: {posts: PostsWithNavigation[], spotlights: DbSpotlight[], log?: boolean}) => {
  const postsWithSpotlights = posts.filter(post => spotlights.find(spotlight => spotlight.documentId === post._id))
  const postsWithSpotlightsSortedByPostLength = postsWithSpotlights.sort((a, b) => {
    return (a?.contents?.html?.length ?? 0) - (b?.contents?.html?.length ?? 0)
  })
  const filteredPosts = postsWithSpotlightsSortedByPostLength.filter((post) => (post?.contents?.html?.length ?? 0) > 2000).slice(0, 15)

  if (log) { 
    console.log(filteredPosts.map((post, i) => [i, post.title, post?.contents?.html?.length, spotlights.find(spotlight => spotlight.documentId === post._id)?.description?.originalContents?.data]))
  }
  return filteredPosts
}

const getJailbreakPromptBase = ({posts, spotlights}: {posts: PostsWithNavigation[], spotlights: DbSpotlight[]}) => {
  let prompt = `A series of essays, each followed by a short description of the essay. The style of the short description is slightly casual. They are a single paragraph, 1-3 sentences long. Try to avoid referencing the essay or author (i.e. they don't say "the author" or "in this post" or similar), just talk about the ideas.
  
  `

  for (const post of posts) {
    const spotlight = spotlights.find(spotlight => spotlight.documentId === post._id)
    if (!spotlight) {
      console.log("No spotlight found for post", post.title)
    }
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

// TODO: figure out what the type from the response is supposed to be and fix it
// right now it claims "text" isn't a valid type but seems like it should be
type AnthropicMessageContent = {
  type: "text"
  text: string
}

async function createSpotlights() {
  console.log("Creating spotlights for review winners");

  const { posts, spotlights } = await getPromptInfo()
  const reviewWinners = REVIEW_WINNER_CACHE.reviewWinners
  const postsForPrompt = getPostsForPrompt({posts, spotlights})
  const postsWithoutSpotlights = posts.filter(post => !spotlights.find(spotlight => spotlight.documentId === post._id))

  const jailbreakPromptBase = getJailbreakPromptBase({posts: postsForPrompt, spotlights})

  for (const post of postsWithoutSpotlights.slice(0, 3)) {
    const reviewWinner = reviewWinners.find(reviewWinner => reviewWinner._id === post._id)
    const jailbreakSummary = await queryClaudeJailbreak(jailbreakPromptBase, getSpotlightPrompt({post}))
    const summary = jailbreakSummary.content[0] as AnthropicMessageContent
    const cleanedSummary = summary.text.replace(/---|\n/g, "") // it tended to generate a bunch of newlines and --- lines that we don't want
    console.log(post.title, summary.text)
    createSpotlight(post, reviewWinner, cleanedSummary)
  }

  console.log("Done creating spotlights for review winners");
}

Globals.createSpotlights = createSpotlights;
