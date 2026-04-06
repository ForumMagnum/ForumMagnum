import Users from "@/server/collections/users/collection";
import { createPasswordHash } from "@/server/vulcan-lib/apollo-server/passwordHelpers";
import { expect, Locator, type Browser, type BrowserContext, type Cookie, type Page } from "@playwright/test";
import pgp, { IDatabase } from "pg-promise";
import getSlug from "speakingurl";

type PlaywrightUser = {
  _id: string,
  username: string,
  displayName: string,
  email: string,
  password: string,
  slug: string,
}

type PlaywrightPost = {
  _id: string,
  author: PlaywrightUser,
  title: string,
  slug: string,
  postPageUrl: string,
}

type PlaywrightRevision = {
  _id: string,
  originalContents: {data: string, type: string},
  html: string,
  userId: string,
  version: string,
  editedAt: Date,
  wordCount: number,
  updateType: string,
  commitMessage: string,
}

type PlaywrightGroup = {
  _id: string,
  name: string,
}

class Database {
  private client: IDatabase<{}> | null = null;

  constructor(private port: number) {}

  get() {
    if (!this.client) {
      const pgPromiseLib = pgp({
        noWarnings: true,
      });
      const host = `localhost:${this.port}`;
      this.client = pgPromiseLib({
        connectionString: `postgres://postgres:password@${host}/postgres`,
        max: 5,
      });
    }
    return this.client;
  }
}

const db = new Database(5433);
const crosspostDb = new Database(5434);

export const uniqueId = new class {
  private usedUserIds = new Set<number>();

  get() {
    // eslint-disable-next-line no-constant-condition
    do {
      const n = Math.floor(Math.random() * 10_000_000);
      if (!this.usedUserIds.has(n)) {
        this.usedUserIds.add(n);
        return n;
      }
    // eslint-disable-next-line no-constant-condition
    } while (true);
  }
}

export const loginUser = async (
  context: BrowserContext,
  {email, password}: PlaywrightUser,
  options?: {
    allowFailure?: boolean,
  }
): Promise<void> => {
  await logout(context);
  const response = await context.request.post("/graphql", {
    data: {
      query: `
        mutation PlaywrightLogin($username: String, $password: String) {
          login(username: $username, password: $password) {
            token
          }
        }
      `,
      variables: {
        username: email,
        password,
      },
    },
    headers: {
      "content-type": "application/json",
    }
  });
  const responseData: {
    data?: {
      login?: {
        token?: string | null,
      } | null,
    },
    errors?: Array<{
      message?: string,
    }>,
  } = await response.json();
  const token = responseData.data?.login?.token;
  if (!token) {
    if (options?.allowFailure) {
      return;
    }
    const errorMessages = responseData.errors?.map(({message}) => message).filter(Boolean).join(", ");
    throw new Error(errorMessages ? `Playwright login failed: ${errorMessages}` : "Playwright login did not return a token");
  }
  await context.addCookies([{
    name: "loginToken",
    value: token,
    url: new URL(response.url()).origin,
  }]);
}

export const createNewUserDetails = (): PlaywrightUser => {
  const n = uniqueId.get();
  const username = `user${n}`;
  return {
    _id: `id-user-${n}`,
    username,
    displayName: username,
    email: `user${n}@example.com`,
    password: `Password${n}!`,
    slug: getSlug(username),
  };
}

type CreateNewUserOptions = {
  database?: Database,
  isAdmin?: boolean,
  karma?: number,
  hideSunshineSidebar?: boolean,
  isReviewed?: boolean,
};

export const createNewUser = async ({
  database = db,
  isAdmin = false,
  karma = 0,
  hideSunshineSidebar = false,
  isReviewed = true,
}: CreateNewUserOptions = {}): Promise<PlaywrightUser> => {
  const user = createNewUserDetails();
  const {_id, username, email, slug, displayName, password} = user;
  const abtestkey = `abtestkey-${username}`;
  const emails = [{address: email, verifed: false}];
  const services = {
    password: {bcrypt: await createPasswordHash(password)},
    resume: {loginTokens: []},
  };

  const reviewedByUserId = isReviewed ? "playwright-dummy-reviewer" : null;

  await database.get().none(`
    INSERT INTO "Users" (
      "_id",
      "username",
      "displayName",
      "email",
      "emails",
      "slug",
      "abTestKey",
      "isAdmin",
      "karma",
      "usernameUnset",
      "acceptedTos",
      "services",
      "hideSunshineSidebar",
      "reviewedByUserId"
    ) VALUES ($1, $2, $3, $4, $5::JSONB[], $6, $7, $8, $9, FALSE, TRUE, $10::JSONB, $11, $12)
  `, [_id, username, displayName, email, emails, slug, abtestkey, isAdmin, karma, services, hideSunshineSidebar, reviewedByUserId]);

  return user;
}

export const createNewRevision = async ({
  userId,
  collectionName,
  documentId,
  fieldName = "contents",
  html,
}: {
  userId: string,
  collectionName: string,
  documentId: string,
  fieldName?: string,
  html: string,
}): Promise<PlaywrightRevision> => {
  const n = uniqueId.get();
  const _id = `id-post-${n}`;
  const originalContents = {
    data: html,
    type: "ckEditorMarkup",
  };
  const wordCount = html.split(/\s+/g).length;
  const changeMetrics = {};
  const editedAt = new Date();
  const updateType = "initial";
  const version = "1.0.0";
  const commitMessage = "";

  await db.get().none(`
    INSERT INTO "Revisions" (
      "_id",
      "userId",
      "collectionName",
      "documentId",
      "fieldName",
      "originalContents",
      "html",
      "wordCount",
      "changeMetrics",
      "editedAt",
      "updateType",
      "version",
      "draft"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, FALSE)
  `, [
    _id,
    userId,
    collectionName,
    documentId,
    fieldName,
    originalContents,
    html,
    wordCount,
    changeMetrics,
    editedAt,
    updateType,
    version,
  ]);

  return {
    _id,
    originalContents,
    html,
    userId,
    version,
    editedAt,
    wordCount,
    updateType,
    commitMessage,
  };
}

export const createNewPost = async (): Promise<PlaywrightPost> => {
  const n = uniqueId.get();
  const _id = `id-post-${n}`;
  const author = await createNewUser();
  const title = `New post ${n}`;
  const slug = getSlug(title);
  const contents = await createNewRevision({
    userId: author._id,
    collectionName: "Posts",
    documentId: _id,
    html: `<div>Test post body ${n}</div>`,
  });
  const postPageUrl = `/posts/${_id}/${slug}`;

  await db.get().none(`
    INSERT INTO "Posts" (
      "_id",
      "userId",
      "author",
      "title",
      "slug",
      "contents_latest",
      "status",
      "isFuture",
      "draft",
      "wasEverUndrafted",
      "maxBaseScore",
      "postedAt",
      "lastCommentedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, 2, FALSE, FALSE, TRUE, 0, NOW(), NOW())
  `, [_id, author._id, author.username, title, slug, contents, contents._id]);

  return {
    _id,
    author,
    title,
    slug,
    postPageUrl,
  };
}

export const enableAnonymousCollaborativeEditing = async ({
  postId,
  accessLevel = "edit",
}: {
  postId: string;
  accessLevel?: "read" | "comment" | "edit";
}): Promise<{ linkSharingKey: string }> => {
  const linkSharingKey = `playwright-share-${uniqueId.get()}`;
  const sharingSettings = {
    anyoneWithLinkCan: accessLevel,
    explicitlySharedUsersCan: "comment",
  };

  await db.get().none(
    `
      UPDATE "Posts"
      SET
        "linkSharingKey" = $2,
        "sharingSettings" = $3::jsonb
      WHERE "_id" = $1
    `,
    [postId, linkSharingKey, sharingSettings],
  );

  const row = await db.get().oneOrNone(
    `SELECT "linkSharingKey", "sharingSettings" FROM "Posts" WHERE "_id" = $1`,
    [postId],
  );
  if (!row?.linkSharingKey || row.linkSharingKey !== linkSharingKey) {
    throw new Error(`Failed to set linkSharingKey for post ${postId}`);
  }
  if (!row?.sharingSettings || row.sharingSettings.anyoneWithLinkCan !== accessLevel) {
    throw new Error(`Failed to set sharingSettings for post ${postId}`);
  }

  return { linkSharingKey };
};

type CreateNewGroupOptions = Partial<{
  organizerIds: string[],
}>;

export const createNewGroup = async ({
  organizerIds = [],
}: CreateNewGroupOptions = {}): Promise<PlaywrightGroup> => {
  const n = uniqueId.get();
  const _id = `id-group-${n}`;
  const name = `Group ${n}`;

  await db.get().none(`
    INSERT INTO "Localgroups" (
      "_id",
      "name",
      "organizerIds",
      "lastActivity"
    ) VALUES ($1, $2, $3, NOW())
  `, [_id, name, organizerIds]);

  return {
    _id,
    name,
  };
}

export const loginNewUser = async (
  context: BrowserContext,
  options?: CreateNewUserOptions,
): Promise<PlaywrightUser> => {
  const user = await createNewUser(options);
  await loginUser(context, user);
  return user;
}

export const deleteCookie = async (context: BrowserContext, cookieName: string) => {
  const oldCookies = await context.cookies();
  const newCookies = oldCookies.filter((cookie: Cookie) => {
    return cookie.name !== cookieName;
  });
  await context.clearCookies();
  await context.addCookies(newCookies);
}

export const logout = (context: BrowserContext) =>
  deleteCookie(context, "loginToken");

export const createCrosspostContexts = async (browser: Browser): Promise<{
  contexts: [BrowserContext, BrowserContext],
  pages: [Page, Page],
  users: [PlaywrightUser, PlaywrightUser],
}> => {
  const contexts = await Promise.all([
    browser.newContext({baseURL: "http://localhost:3456"}),
    browser.newContext({baseURL: "http://localhost:3467"}),
  ]);
  const pages = await Promise.all(
    contexts.map((ctx) => ctx.newPage()),
  ) as [Page, Page];
  const users = await Promise.all(contexts.map((ctx, i) => loginNewUser(ctx, {
    database: [db, crosspostDb][i],
    karma: 1000,
  }))) as [PlaywrightUser, PlaywrightUser];
  return {contexts, pages, users};
}

/**
 * Fill in the title and body on the "new post" or "edit post" page.
 * This is extracted into a helper method for two reasons:
 *  - MUI inputs are super-buggy and require special handling
 *  - The CK editor selector is pretty obscure
 */
export const setPostContent = async (page: Page, {
  title,
  body,
  titlePlaceholder = "Post title",
}: {
  title?: string,
  body?: string,
  titlePlaceholder?: string,
  bodyLabel?: string,
}) => {
  // Clear and fill the editor in two separate steps, because Playwright's .fill()
  // fails in Firefox (but not other browsers) if these are one step
  if (title) {
    await page.getByPlaceholder(titlePlaceholder).fill("");
    await page.getByPlaceholder(titlePlaceholder).fill(title);
  }

  if (body) {
    const postContentEditor = page.locator('#postContent [contenteditable="true"]').first();
    const bodyEditor = await postContentEditor.count()
      ? postContentEditor
      : page.locator('.EditorFormComponent-root [contenteditable="true"]').first();
    await expect(bodyEditor).toBeVisible();
    await bodyEditor.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(body);
    await expect(bodyEditor).toContainText(body);
    await bodyEditor.evaluate((editor) => {
      (editor as HTMLElement).blur();
    });
    await page.waitForTimeout(100);
  }
}

export async function publishPostFromPostEditPage({page, context}: {page: Page, context: BrowserContext}) {
  await page.waitForTimeout(100);
  if (await page.locator(".MobileEditorBottomBar-publishButton").isVisible()) {
    // Mobile screen width
    await expect(page.locator(".MobileEditorBottomBar-publishButton")).toBeVisible();
    await page.locator(".MobileEditorBottomBar-publishButton").click()
  } else {
    // Desktop screen width
    // Open the publishing panel
    await expect(page.locator(".PostForm-publishIconButton")).toBeVisible();
    await page.locator(".PostForm-publishIconButton").click();

    // Click the publish button on the panel that this opened. Disambiguate using visibility
    // against another, hidden button with the same class name (the mobile version).
    const visiblePublishButton = page.locator(".PostSubmit-submitButton").filter({ has: page.locator(":visible") }).first();
    await expect(visiblePublishButton).toBeVisible();
    await visiblePublishButton.click();
  }
}

/**
 * Assert that there is an element with the given locator which is visible. Allows
 * for invisible elements that also match (so that nextjs's Activity background DOM
 * elements don't mess it up).
 */
export function expectVisible(locator: Locator) {
  return expect(locator.filter({ has: locator.locator(":visible") }).first()).toBeVisible();
}

export const getUserKarma = async (userId: string) => {
  const karma = await db.get().oneOrNone(`
    SELECT "karma" FROM "Users" WHERE "_id" = $1
  `, [userId]);
  return karma?.karma ?? 0;
}
