import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser, logout } from "./playwrightUtils";

test("create and edit post", async ({page, context}) => {
  await page.goto("/newPost");
});
