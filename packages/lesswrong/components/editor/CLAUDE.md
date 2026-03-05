# Editor Development Guide

## Accessing the Post Editor in the Browser

The post editor at `/newPost` requires authentication. Use the chrome-devtools MCP to open a browser page and log in programmatically.

### Test Account Credentials

- **Username**: `agent-test`
- **Email**: `agent-test@localhost.invalid`
- **Password**: `agent-test-password-123`

### Login Procedure

1. Open a new page with the chrome-devtools MCP:
   ```
   new_page({ url: "http://localhost:3000/newPost" })
   ```

2. Wait 2 seconds to be redirected to the /editPost page, then check whether you're already logged in via `evaluate_script` looking for the editor:
  ```javascript
  const contentEditable = document.querySelector('[contenteditable="true"]');
  return { contentEditableExists: !!contentEditable };
  ```

3a. If `contentEditableExists: true`, you're ready to go.  Skip the remaining steps.

3b. If not, execute a GraphQL login mutation via `evaluate_script`. Try logging in first; if that fails (e.g. the account doesn't exist yet in the local DB), fall back to creating the account:

   ```javascript
   async () => {
     const username = "agent-test";
     const password = "agent-test-password-123";
     const email = "agent-test@localhost.invalid";

     // Try login first
     const loginResult = await fetch('/graphql', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         query: `mutation { login(username: "${username}", password: "${password}") { token } }`
       })
     });
     const loginData = await loginResult.json();
     if (loginData.data?.login?.token) {
       return { action: "login", success: true };
     }

     // Login failed — create account then log in
     const signupResult = await fetch('/graphql', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         query: `mutation { signup(username: "${username}", email: "${email}", password: "${password}", subscribeToCurated: false) { token } }`
       })
     });
     const signupData = await signupResult.json();
     if (signupData.data?.signup?.token) {
       return { action: "signup", success: true };
     }
     return { success: false, loginError: loginData.errors, signupError: signupData.errors };
   }
   ```

4. After the mutation succeeds, reload the page to pick up the auth cookie:
   ```
   navigate_page({ type: "url", url: "http://localhost:3000/newPost" })
   ```

5. Verify login worked via `evaluate_script`:

   ```javascript
   () => {
     const usersLink = document.querySelector('a[href*="/users/"]');
     const loginButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'LOGIN');
     const contentEditor = document.querySelector('[contenteditable="true"]');
     return {
       loggedIn: !!usersLink && !loginButton,
       username: usersLink?.textContent?.trim(),
       editorReady: !!contentEditor,
     };
   }
   ```

   Confirm `loggedIn` is `true` and `editorReady` is `true`.

6. If the account was just created (step 3b returned `action: "signup"`), set `beta: true` on the user so they have access to the Lexical editor. Run this via `evaluate_script`:

   ```javascript
   async () => {
     // First, get the current user's ID
     const meResult = await fetch('/graphql', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         query: `query { currentUser { _id } }`
       })
     });
     const meData = await meResult.json();
     const userId = meData.data?.currentUser?._id;
     if (!userId) return { success: false, error: "Not logged in" };

     // Set beta: true
     const updateResult = await fetch('/graphql', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         query: `mutation { updateUser(selector: { _id: "${userId}" }, data: { beta: true }) { data { _id beta } } }`
       })
     });
     const updateData = await updateResult.json();
     if (updateData.data?.updateUser?.data?.beta) {
       return { success: true, userId };
     }
     return { success: false, error: updateData.errors };
   }
   ```

   Then reload the page again to pick up the updated settings:
   ```
   navigate_page({ type: "url", url: "http://localhost:3000/newPost" })
   ```

   This only needs to be done once per account creation. The `beta` flag persists across sessions, but the test account is wiped by nightly DB syncs, so it will need to be re-created (and `beta` re-set) after each sync.

### Notes

- The login/signup mutations set a `loginToken` cookie automatically via `Set-Cookie` headers, so no manual cookie management is needed.
- Authentication code is in `@/server/vulcan-lib/apollo-server/authentication.tsx`, if for some reason you need it (but by default you won't).
- This browser session does not share cookies with the user's browser profile, so it should either start logged out or logged in to the test account.

## Adding new content types

### Suggestion mode

When adding a new content type (e.g. a new `DecoratorBlockNode`), you should **default to forbidding creation and deletion of that content type while the editor is in "suggesting" mode**. Suggestion mode tracks changes as suggestions rather than direct edits, and adding support for most block-level content types is a non-trivial undertaking.  Some content types also permit structural modifications (i.e. tables), rather than just plain creation and deletion.  Structural/attribute modifications should also be forbidden by default, which may require some bespoke logic.  If the new content type is a container that can contain other types of editor content which itself can be edited, that inner content should be possible to create suggested edits for if it's otherwise of a content type which can have suggested edits created for it at the editor root.  (As a trivial example, users are able to create suggested edits of text inside of collapsible sections, even though collapsible sections themselves can't be created/deleted while in "suggesting" mode.)  Most content types don't have structural or attribute-level state which can be modified this way, however.

Insertion should be blocked at the earliest possible point. If your content type has a slash command entry in `ComponentPickerPlugin`, check `isSuggestionMode` in the slash command's `onSelect` handler (before opening any modal or dispatching any command). As a defence-in-depth measure, also check in the underlying command handler in your plugin component. Both places should show a flash error message.

```typescript
// In ComponentPickerPlugin/index.tsx — block before opening the modal:
new ComponentPickerOption('My Widget', {
  keywords: ['my', 'widget'],
  onSelect: () => {
    if (isSuggestionMode) {
      flash({ messageString: 'My widgets are not supported in suggestion mode', type: 'error' });
      return;
    }
    showModal('Insert My Widget', (onClose) => (
      <InsertMyWidgetDialog activeEditor={editor} onClose={onClose} />
    ));
  },
}),

// In MyPlugin.tsx — block at the command level as a fallback:
editor.registerCommand(
  INSERT_MY_NODE_COMMAND,
  (payload) => {
    if (isSuggestionMode) {
      flash({ messageString: 'My widgets are not supported in suggestion mode', type: 'error' });
      return true;
    }
    // ... normal insertion logic ...
    return true;
  },
  COMMAND_PRIORITY_EDITOR,
);
```

Pass `isSuggestionMode` from `Editor.tsx` to both `ComponentPickerPlugin` and your plugin component.

Deletion of `DecoratorBlockNode` subclasses is automatically blocked in suggestion mode — the `SuggestedEditsPlugin` uses an allowlist of node types it knows how to wrap as deletion suggestions (currently only images and dividers), so any unrecognized decorator block node is implicitly protected.  Other block elements that not `DecoratorBlockNode` subclasses are often implicitly protected through various mechanisms, but you will need to explicitly test those to check whether you need to write bespoke logic to prevent deleting them while in "suggesting" mode.

**Reference implementations**: `IframeWidgetPlugin.ts` and the Iframe Widget entry in `ComponentPickerPlugin/index.tsx`.

After building the initial prototype, ask the user whether they want to implement full suggestion-mode support for the new content type. This requires creating handlers for the relevant command(s) inside of `SuggestionModePlugin` that execute the logic necessary to create suggested insertions of that content type, as well as potentially requiring additional handling in the `KEY_BACKSPACE_COMMAND` and `KEY_DELETE_COMMAND` handlers in that plugin. Many content types will also require additional styling so that suggested insertions/deletions are legibly distinct in the editor from the content simply being there.
