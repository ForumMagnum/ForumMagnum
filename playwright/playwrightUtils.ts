import type { BrowserContext } from "@playwright/test";
import getSlug from "speakingurl";
import pgp from "pg-promise";

type PlaywrightUser = {
  username: string,
  email: string,
  password: string,
}

const usedUserIds = new Set<number>();

const getUniqueUserId = () => {
  do {
    const n = Math.floor(Math.random() * 10_000_000);
    if (!usedUserIds.has(n)) {
      usedUserIds.add(n);
      return n;
    }
  } while (true);
}

export const createNewUserDetails = (): PlaywrightUser => {
  const n = getUniqueUserId();
  return {
    username: `test${n}`,
    email: `test${n}@example.com`,
    password: "hunter2!",
  };
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

export const loginNewUser = async (
  context: BrowserContext,
): Promise<PlaywrightUser> => {
  const pgPromiseLib = pgp({
    noWarnings: true,
  });

  const db = pgPromiseLib({
    connectionString: "postgres://postgres:password@localhost:5433/postgres",
    max: 5,
  });

  const user = createNewUserDetails();
  const {username, email} = user;
  const id = `id-${username}`;
  const slug = getSlug(username);
  const abtestkey = `abtestkey-${username}`;
  const emails = [{address: email, verifed: false}];

  await db.none(`
    INSERT INTO "Users" (
      "_id",
      "username",
      "displayName",
      "email",
      "emails",
      "slug",
      "abTestKey",
      "usernameUnset",
      "acceptedTos",
      "createdAt"
    ) VALUES ($1, $2, $3, $4, $5::JSONB[], $6, $7, FALSE, TRUE, NOW())
  `, [id, username, username, email, emails, slug, abtestkey]);

  await loginUser(context, user);
  return user;
}
