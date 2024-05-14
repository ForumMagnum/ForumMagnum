import type { BrowserContext } from "@playwright/test";
import pgp, { IDatabase } from "pg-promise";
import getSlug from "speakingurl";

type PlaywrightUser = {
  _id: string,
  username: string,
  email: string,
  password: string,
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

const db = new class {
  private client: IDatabase<{}> | null = null;

  get() {
    if (!this.client) {
      const pgPromiseLib = pgp({
        noWarnings: true,
      });
      this.client = pgPromiseLib({
        connectionString: "postgres://postgres:password@localhost:5433/postgres",
        max: 5,
      });
    }
    return this.client;
  }
}

const uniqueId = new class {
  private usedUserIds = new Set<number>();

  get() {
    do {
      const n = Math.floor(Math.random() * 10_000_000);
      if (!this.usedUserIds.has(n)) {
        this.usedUserIds.add(n);
        return n;
      }
    } while (true);
  }
}

export const loginUser = async (
  context: BrowserContext,
  {email, password}: PlaywrightUser,
): Promise<void> => {
  await context.request.post("/auth/auth0/embedded-login", {
    data: {
      email,
      password,
    },
  });
}

export const createNewUserDetails = (): PlaywrightUser => {
  const n = uniqueId.get();
  return {
    _id: `id-user-${n}`,
    username: `user${n}`,
    email: `user${n}@example.com`,
    password: `Password${n}!`,
  };
}

export const createNewUser = async (): Promise<PlaywrightUser> => {
  const user = createNewUserDetails();
  const {_id, username, email} = user;
  const slug = getSlug(username);
  const abtestkey = `abtestkey-${username}`;
  const emails = [{address: email, verifed: false}];

  await db.get().none(`
    INSERT INTO "Users" (
      "_id",
      "username",
      "displayName",
      "email",
      "emails",
      "slug",
      "abTestKey",
      "usernameUnset",
      "acceptedTos"
    ) VALUES ($1, $2, $3, $4, $5::JSONB[], $6, $7, FALSE, TRUE)
  `, [_id, username, username, email, emails, slug, abtestkey]);

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
      "contents",
      "contents_latest",
      "status",
      "isFuture",
      "draft",
      "wasEverUndrafted",
      "maxBaseScore",
      "postedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 2, FALSE, FALSE, TRUE, 0, NOW())
  `, [_id, author._id, author.username, title, slug, contents, contents._id]);

  return {
    _id,
    author,
    title,
    slug,
    postPageUrl,
  };
}

export const loginNewUser = async (
  context: BrowserContext,
): Promise<PlaywrightUser> => {
  const user = await createNewUser();
  await loginUser(context, user);
  return user;
}
