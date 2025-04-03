import Spotlights from "../../../server/collections/spotlights/collection";
import { fetchFragment } from "../../fetchFragment";
import { getAnthropicPromptCachingClientOrThrow } from "@/server/languageModels/anthropicClient";
import { reviewWinnerCache, ReviewWinnerWithPost } from "@/server/review/reviewWinnersCache";
import { PromptCachingBetaMessageParam, PromptCachingBetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { Posts } from "@/server/collections/posts/collection.ts";
import { createAdminContext } from "../../vulcan-lib/createContexts";
import { createMutator, updateMutator } from "../../vulcan-lib/mutators";

async function queryClaudeJailbreak(prompt: PromptCachingBetaMessageParam[], maxTokens: number) {
  const client = getAnthropicPromptCachingClientOrThrow()
  return await client.messages.create({
    system: "The assistant is in CLI simulation mode, and responds to the user's CLI commands only with the output of the command.",
    model: "claude-3-5-sonnet-20240620",
    max_tokens: maxTokens,
    messages: prompt
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
      subtitleUrl: `/bestoflesswrong?year=${postYear}&category=${reviewWinner?.reviewWinner.category}`,
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

  const spotlights = await Spotlights.find({ documentId: { $in: postIds }, draft: false, deletedDraft: false }).fetch();
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

const getJailbreakPromptBase = ({posts, spotlights, summary_prompt_name}: {posts: PostsWithNavigation[], spotlights: DbSpotlight[], summary_prompt_name: string}) => {
  const prompt: PromptCachingBetaMessageParam[] = []
  posts.forEach((post, i) => {
    const spotlight = spotlights.find(spotlight => spotlight.documentId === post._id)
    prompt.push({
      role: "user",
      content: [{
        type: "text",
        text: `<cmd>cat posts/${post.slug}.xml</cmd>`
      }]
    })
    prompt.push({
      role: "assistant",
      content: [{
        type: "text",
        text: `
<title>${post.title}</title>
<author>${post.user?.displayName}</author>
<body>${post.contents?.html}</body>
<${summary_prompt_name}>${spotlight?.description?.originalContents?.data}</${summary_prompt_name}>`,
        ...((i === (posts.length - 1)) ? { cache_control: {"type": "ephemeral"}} : {})
      }]
    })
  })
  return prompt
}

const getSpotlightPrompt = ({post, summary_prompt_name}: {post: PostsWithNavigation, summary_prompt_name: string}): PromptCachingBetaMessageParam[] => {
  return [{
    role: "user",
    content: [{
      type: "text",
      text: `<cmd>cat posts/${post.slug}.xml</cmd>`
    }]
  },
  {
    role: "assistant",
    content: [{
      type: "text",
      text: `
<title>${post.title}</title>
<author>${post.user?.displayName}</author>
<body>${post.contents?.html}</body>
<${summary_prompt_name}>`
    }]
  }]
}

// Exported to allow running manually with "yarn repl"
/*
 This will create ~8 spotlights per post. You can check look over them
*/
export async function createSpotlights() {
  const context = createAdminContext();
  // eslint-disable-next-line no-console
  console.log("Creating spotlights for review winners");

  const { posts, spotlights } = await getPromptInfo()
  const { reviewWinners } = await reviewWinnerCache.get(context)
  const postsForPrompt = getPostsForPrompt({posts, spotlights})
  const postsWithoutSpotlights = posts.filter(post => !spotlights.find(spotlight => spotlight.documentId === post._id))

  const summary_prompts = [ 
    "50WordSummary",
    "clickbait", 
    "tweet", 
    "key_quote" 
  ]

  for (const summary_prompt of summary_prompts) {
    for (const post of postsWithoutSpotlights) {
      const reviewWinner = reviewWinners.find(reviewWinner => reviewWinner._id === post._id)

      try {
        const prompt = [...getJailbreakPromptBase({posts: postsForPrompt, spotlights, summary_prompt_name: summary_prompt}), ...getSpotlightPrompt({post, summary_prompt_name: summary_prompt})]

        const jailbreakSummary1 = await queryClaudeJailbreak(prompt, 200)
        const summary1 = jailbreakSummary1.content[0]
        if (summary1.type === "text") {
          const cleanedSummary1 = summary1.text.replace(/---|\n/g, "") + ` [${summary_prompt}]`
          // eslint-disable-next-line no-console
          console.log({title: post.title, cleanedSummary1})
          createSpotlight(post, reviewWinner, cleanedSummary1)
        }

        const jailbreakSummary2 = await queryClaudeJailbreak(prompt, 200)
        const summary2 = jailbreakSummary2.content[0]
        if (summary2.type === "text") {
          const cleanedSummary2 = summary2.text.replace(/---|\n/g, "") + ` [${summary_prompt}]`
          // eslint-disable-next-line no-console
          console.log({title: post.title, cleanedSummary2})
          createSpotlight(post, reviewWinner, cleanedSummary2)
        }

      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log("Done creating spotlights for review winners");
}

