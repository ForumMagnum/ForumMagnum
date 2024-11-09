import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { createAdminContext, createMutator, Globals } from "../vulcan-lib";
import { createNewJargonTerms } from "../resolvers/jargonResolvers/jargonTermMutations";
import { fetchFragmentSingle } from "../fetchFragment";

const selector = `
    SELECT
      u._id,
      u."displayName",
      u.karma,
      (
        SELECT COUNT(*) 
        FROM "Posts" p2 
        WHERE p2.draft IS FALSE 
        AND p2."userId" = u._id 
        AND p2."postedAt" > CURRENT_DATE - INTERVAL '1 year'
      ) AS "lastYearPostCount",
      ARRAY_AGG(p._id ORDER BY p."postedAt" DESC) AS "postIds"
    FROM "Users" u
    JOIN "Posts" p ON u._id = p."userId"
    JOIN "Revisions" r ON p.contents_latest = r._id
    WHERE 1=1
    AND u.karma > 2000
    AND r.html LIKE '%mjpage%'
    AND p.draft IS FALSE
    AND p."postedAt" > CURRENT_DATE - INTERVAL '1 year'
    GROUP BY 1, 2, 3, 4
    ORDER BY ((
      SELECT COUNT(*) 
      FROM "Posts" p2 
      WHERE p2.draft IS FALSE 
      AND p2."userId" = u._id 
      AND p2."postedAt" > CURRENT_DATE - INTERVAL '1 year'
    ) * LOG(u.karma::numeric, 2)) DESC
    LIMIT 100
`;

async function generateJargonForUsers() {
  const db = getSqlClientOrThrow();

  const result = await db.any<{
    _id: string;
    displayName: string;
    karma: number;
    lastYearPostCount: number;
    postIds: string[];
  }>(selector);

  console.log(result);
  console.log(result.length);

  const posts = result.map((user) => user.postIds).flat();

  const context = createAdminContext();
  const currentUser = context.currentUser;
  if (currentUser === null) {
    throw new Error("No current user");
  }

  // await executePromiseQueue(
  //   posts.map(postId => () =>
  //     createNewJargonTerms({postId, currentUser}) 
  //   ), 
  //   5
  // );
  console.log(posts.map(post => `https://www.lesswrong.com/posts/${post._id}/${post.slug}`).join("\n"));
  // sendJargonMessagesToUsers();
}

async function sendJargonMessagesToUserScript(users: {_id: string, displayName: string}[], posts: PostsListBase[]) {
  const context = createAdminContext();
  // Fetch the user with displayName "Raemon"
  const raemonUser = await context.Users.findOne(
    { displayName: 'Raemon' },
    { context }
  );

  if (!raemonUser) {
    throw new Error('User "Raemon" not found');
  }

  const post = await fetchFragmentSingle({
    collectionName: "Posts",
    fragmentName: "PostsListBase",
    currentUser: raemonUser,
    selector: {_id: "thc4RemfLcM5AdJDa"},
  });
  if (!post) {
    throw new Error('Post not found');
  }

  type UserWithPost = {
    userId: string;
    displayName: string;
    post: PostsListBase;
  }

  const sendJargonMessage = async ({userId, displayName, post}: UserWithPost) => {

    const messageText = `<p>Hey ${displayName}, we're beta testing a new <a href="https://www.lesswrong.com/posts/sZvMLWrWomN28uWA9/jargonbot-beta-test">automated glossary</a> feature. I'd be interested in feedback. In particular: Does it feel promising? Is it annoying? And does its current quality feel good enough to use as part of your general post publishing flow?</p> 
    <p>We ran the auto-generator on <a href="https://www.lesswrong.com/editPost?postId=thc4RemfLcM5AdJDa&key=5bf41ee9ced2611aefc10de237ee5f" "https://www.lesswrong.com/posts/${post._id}/${post.slug}">${post.title}</a>. You can see some unapproved terms (which are not shown by default, although users can toggle them on with a warning saying "Unapproved by author. Believe at your peril."</p>
    <p>By default it runs on published posts. You can turn that off, and you can also turn on "run in the background while writing drafts" so by the time you're done you can quickly review terms and approve (or edit) the ones you want.</p>
    <p>Curious how it feels to use. We're trying to make it a streamlined process for authors. We'll be iterating on the quality of the explanations over time.</p>`

    // Create a new conversation
    const conversationResult = await createMutator({
      collection: context.Conversations,
      document: {
        participantIds: [raemonUser._id, userId],
      },
      currentUser: raemonUser,
      validate: false,
      context,
    });

    // Send a message to the user
    await createMutator({
      collection: context.Messages,
      document: {
        conversationId: conversationResult.data._id,
        userId: raemonUser._id,
        contents: {
          originalContents: {
            data: messageText,
            type: 'html',
          },
        },
      },
      currentUser: raemonUser,
      validate: false,
      context,
    });
  }

  void sendJargonMessage({userId: "A4jsAzrXTXHZJR2Ag", displayName: "Raemon", post});

  // await executePromiseQueue(
  //   result.map(user => sendJargonMessage({userId: user._id, displayName: user.displayName, postId: user.postIds[0]})),
  //   5
  // );
}

Globals.generateJargonForUsers = generateJargonForUsers;
Globals.sendJargonMessagesToUserScript = sendJargonMessagesToUserScript;
